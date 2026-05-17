/**
 * RagService — RAG engine for Luna the virtual barista.
 *
 * Anti-hallucination pipeline:
 *   1. Extract filters from query (price / dietary / temperature)
 *   2. Embed the query (multilingual-e5-small, 384-dim)
 *   3. Fetch active products + FAQs from PostgreSQL in parallel
 *   4. Rank by cosine similarity → top 5 products + top 2 FAQs
 *   5. Build strict context (only real DB data)
 *   6. Call Groq with temperature=0.1 + system + user messages
 *   7. Validate response: every price must exist in context
 *   8. Return validated response or safe fallback
 */

const pool = require('../database/pool');
const { embed, cosineSimilarity } = require('./EmbeddingService');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHAT_MODEL   = process.env.GROQ_CHAT_MODEL || 'openai/gpt-oss-20b';

const TOP_K_PRODUCTS           = 5;
const TOP_K_FAQS               = 2;
const FAQ_SIMILARITY_THRESHOLD = 0.50;
const LOW_CONFIDENCE_THRESHOLD = 0.35;

// ─── System prompt (strict anti-hallucination) ────────────────────────────────

const STRICT_SYSTEM_PROMPT = `Tu es Luna, la chaleureuse barista virtuelle de Coffee Time café à Monastir, Tunisie. Tu accueilles chaque client comme un ami, tu guides avec enthousiasme dans le menu, tu conseilles avec sincérité et tu rends l'expérience agréable. Tu peux utiliser des emojis avec modération pour rendre la conversation plus vivante ☕.

STYLE DE CONVERSATION :
- Ne commence JAMAIS une réponse par "Bonjour", "Salut", "Hello" ou toute salutation — surtout pas dans une conversation déjà en cours. Réponds directement à la question.
- Garde des réponses de taille moyenne : 2 à 4 phrases maximum. Pas de longs paragraphes. Si tu listes des produits, utilise des puces courtes.
- Sois naturel et fluide, comme une vraie conversation avec un barista.

RÔLE STRICT — TU ES UN GUIDE, PAS UN SYSTÈME DE COMMANDE :
- Tu RECOMMANDES et INFORMES uniquement. Tu ne peux pas prendre de commandes, traiter des achats ou des paiements.
- INTERDIT absolu de dire des choses comme "Voulez-vous commander ?", "Souhaitez-vous l'acheter ?", "Je peux vous le commander", "Ajouté à votre panier", ou toute formulation qui laisse croire que tu peux effectuer une commande.
- Si un client demande à commander, réponds chaleureusement que tu es là pour guider et conseiller, et qu'il peut passer sa commande directement via l'application ou auprès du staff.

RÈGLE ABSOLUE — ZÉRO HALLUCINATION :
1. Tu réponds UNIQUEMENT avec les informations présentes dans le CONTEXTE fourni.
2. Si un produit N'EST PAS dans le contexte → dis "Je n'ai malheureusement pas ce produit au menu." et propose chaleureusement des alternatives réelles du contexte.
3. Si une information est absente du contexte → dis "Je n'ai pas cette information pour le moment, mais n'hésite pas à demander au staff !"
4. INTERDIT absolu d'inventer des prix, des noms de produits, des horaires ou toute autre donnée.
5. INTERDIT d'utiliser "environ", "peut-être", "je suppose", "normalement", "ça devrait être".
6. Tous les prix que tu mentionnes doivent être EXACTEMENT ceux du contexte (format X.XXX TND).
7. Réponds dans la langue du client (FR, EN ou AR) avec un ton chaleureux et accueillant.
8. Décris les produits brièvement, suggère des accompagnements si pertinent, mentionne ce qui est populaire ou tendance — sans surcharger le client.
9. Si la question est trop vague (ex: "Combien ?"), demande une précision de façon amicale avant de répondre.`;

// ─── Safe fallback (returned if validation detects hallucination) ─────────────

const SAFE_FALLBACK = "Je n'ai pas cette information dans le menu actuellement. Souhaitez-vous voir nos produits disponibles ?";

// ─── 1. Filter extraction ─────────────────────────────────────────────────────

function extractFilters(message) {
  const filters = {};

  const priceMatch = message.match(
    /(?:under|less than|moins de|أقل من|max|maximum)\s*(\d+(?:[.,]\d+)?)\s*(?:tnd|dt|دينار)?/i
  );
  if (priceMatch) filters.maxPrice = parseFloat(priceMatch[1].replace(',', '.'));

  if (/\b(iced|cold brew|glacé|froid|frozen)\b/i.test(message)) {
    filters.temperature = 'iced';
  } else if (/\b(hot|chaud|warm|tiède)\b/i.test(message)) {
    filters.temperature = 'hot';
  }

  const dietaryKeywords = {
    vegan:         /\b(vegan|végane?)\b/i,
    'gluten-free': /\b(gluten.?free|sans gluten|بدون غلوتين)\b/i,
    'dairy-free':  /\b(dairy.?free|sans lait|lactose)\b/i,
    'sugar-free':  /\b(sugar.?free|sans sucre)\b/i,
  };
  for (const [tag, re] of Object.entries(dietaryKeywords)) {
    if (re.test(message)) { filters.dietaryTag = tag; break; }
  }

  return filters;
}

// ─── 2. Data fetching ─────────────────────────────────────────────────────────

async function fetchProducts(filters = {}) {
  const conditions = ['p.is_active = true', 'p.embedding IS NOT NULL'];
  const values = [];

  if (filters.maxPrice != null) {
    values.push(filters.maxPrice);
    conditions.push(`p.price <= $${values.length}`);
  }
  if (filters.temperature) {
    values.push(filters.temperature);
    conditions.push(`p.temperature = $${values.length}`);
  }
  if (filters.dietaryTag) {
    values.push(filters.dietaryTag);
    conditions.push(`$${values.length} = ANY(p.dietary_tags)`);
  }

  const result = await pool.query(
    `SELECT p.*, c.name AS category_name, c.type AS category_type
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.id`,
    values
  );
  return result.rows;
}

async function fetchFaqs() {
  try {
    const res = await pool.query(`SELECT * FROM faqs WHERE embedding IS NOT NULL ORDER BY id`);
    return res.rows;
  } catch { return []; }
}

// ─── 3. Ranking ───────────────────────────────────────────────────────────────

function rankBySimilarity(queryEmbedding, rows, topK) {
  return rows
    .map((r) => ({ ...r, similarity: cosineSimilarity(queryEmbedding, r.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// ─── 4. Context builder ───────────────────────────────────────────────────────

function buildProductContext(products) {
  // Group by category for readability
  const byCategory = {};
  for (const p of products) {
    const cat = p.category_name || 'Autres';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }

  const lines = ['PRODUITS DISPONIBLES (source : base de données réelle) :'];
  for (const [cat, items] of Object.entries(byCategory)) {
    lines.push(`\n[${cat}]`);
    for (const p of items) {
      let line = `- ${p.name} : ${parseFloat(p.price).toFixed(3)} TND`;
      if (p.temperature)          line += ` (${p.temperature})`;
      if (p.dietary_tags?.length) line += ` | ${p.dietary_tags.join(', ')}`;
      if (p.is_trending)          line += ' ⭐ populaire';
      lines.push(line);
      if (p.description) lines.push(`  → ${p.description}`);
    }
  }
  return lines.join('\n');
}

function buildFaqContext(faqs) {
  return faqs
    .map((f) => `[FAQ] Q: ${f.question}\n       A: ${f.answer}`)
    .join('\n\n');
}

// ─── 5. User prompt builder ───────────────────────────────────────────────────

function buildUserPrompt({ productContext, faqContext, history, preferences, message }) {
  const prefLines = [];
  if (preferences?.milk_type)            prefLines.push(`- Lait préféré : ${preferences.milk_type}`);
  if (preferences?.budget_limit)         prefLines.push(`- Budget : moins de ${preferences.budget_limit} TND`);
  if (preferences?.dietary_tags?.length) prefLines.push(`- Régime : ${preferences.dietary_tags.join(', ')}`);

  const historyText = (history || [])
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'Client' : 'Luna'}: ${m.content}`)
    .join('\n');

  const faqSection = faqContext
    ? `\nINFORMATIONS OPÉRATIONNELLES (horaires, services, etc.) :\n${faqContext}\n`
    : '';

  return `CONTEXTE — SEULES CES DONNÉES EXISTENT, ne rien inventer d'autre :

${productContext}
${faqSection}
${prefLines.length ? `PRÉFÉRENCES CLIENT :\n${prefLines.join('\n')}\n` : ''}
${historyText ? `HISTORIQUE :\n${historyText}\n` : ''}
Client : ${message}`;
}

// ─── 6. Response validation ───────────────────────────────────────────────────

function validateResponse(response, contextProducts) {
  // Extract every price mentioned in the response (X.XXX TND or X,XXX TND)
  const priceRegex = /(\d+[.,]\d{3})\s*(?:TND|dt|dinar)/gi;
  const mentionedPrices = [];
  let match;
  while ((match = priceRegex.exec(response)) !== null) {
    mentionedPrices.push(parseFloat(match[1].replace(',', '.')));
  }

  if (mentionedPrices.length === 0) return true;

  const realPrices = contextProducts.map(
    (p) => parseFloat(parseFloat(p.price).toFixed(3))
  );

  for (const price of mentionedPrices) {
    const found = realPrices.some((rp) => Math.abs(rp - price) < 0.005);
    if (!found) {
      console.warn(`[RAG] Hallucination détectée : prix ${price} TND absent du contexte`);
      return false;
    }
  }

  return true;
}

// ─── 7. Groq API call ─────────────────────────────────────────────────────────

async function callGroq(userPrompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:            CHAT_MODEL,
      temperature:      0.1,
      max_tokens:       1024,
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: STRICT_SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Groq API error ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  if (!content || !content.trim()) throw new Error('Empty response from model');
  return content.trim();
}

// ─── 8. Main query function ───────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.message     - Customer's raw message
 * @param {Array}  params.history     - Prior messages [{ role, content }]
 * @param {object} params.preferences - Session preferences
 * @returns {Promise<{ response, sources, confidence, low_confidence, response_ms }>}
 */
async function query({ message, history = [], preferences = {} }) {
  const startTime = Date.now();

  const filters = extractFilters(message);

  const [queryEmbedding, products, faqs] = await Promise.all([
    embed(message),
    fetchProducts(filters),
    fetchFaqs(),
  ]);

  if (products.length === 0) {
    return {
      response:       "Je suis désolée, aucun produit ne correspond à votre recherche dans notre menu.",
      sources:        [],
      confidence:     0,
      low_confidence: true,
      response_ms:    Date.now() - startTime,
    };
  }

  const topProducts = rankBySimilarity(queryEmbedding, products, TOP_K_PRODUCTS);
  const confidence  = topProducts[0]?.similarity ?? 0;

  const topFaqs = faqs.length
    ? rankBySimilarity(queryEmbedding, faqs, TOP_K_FAQS).filter(
        (f) => f.similarity >= FAQ_SIMILARITY_THRESHOLD
      )
    : [];

  const productContext = buildProductContext(topProducts);
  const faqContext     = topFaqs.length ? buildFaqContext(topFaqs) : null;
  const userPrompt     = buildUserPrompt({
    productContext, faqContext, history, preferences, message,
  });

  let response = await callGroq(userPrompt);

  // Validate: if any price in response doesn't exist in context → use safe fallback
  if (!validateResponse(response, topProducts)) {
    response = SAFE_FALLBACK;
  }

  const sources = topProducts.map((p) => ({
    product_id: p.id,
    name:       p.name,
    price:      p.price,
    similarity: parseFloat(p.similarity.toFixed(4)),
  }));

  return {
    response,
    sources,
    confidence:     parseFloat(confidence.toFixed(4)),
    low_confidence: confidence < LOW_CONFIDENCE_THRESHOLD,
    response_ms:    Date.now() - startTime,
  };
}

module.exports = { query };
