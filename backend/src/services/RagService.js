/**
 * RagService — the core RAG engine for Luna the virtual barista.
 *
 * Flow for each customer message:
 *   1. Extract price / dietary / temperature filters from query text
 *   2. Embed the query with Ollama nomic-embed-text (local, 768-dim)
 *   3. Fetch active products (applying filters) + all FAQs in parallel
 *   4. Rank products and FAQs by cosine similarity
 *   5. Build a combined context block (top products + top FAQ if relevant)
 *   6. Call Ollama llama3.2 with system prompt + context + history
 *   7. Return { response, sources, confidence }
 */

const pool = require('../database/pool');
const { embed, cosineSimilarity } = require('./EmbeddingService');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHAT_MODEL   = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';

const TOP_K_PRODUCTS = 5;
const TOP_K_FAQS = 2;
const FAQ_SIMILARITY_THRESHOLD = 0.50;
const LOW_CONFIDENCE_THRESHOLD = 0.35;

// ─── 1. Filter extraction ────────────────────────────────────────────────────

function extractFilters(message) {
  const filters = {};

  // Price ceiling: "under 8", "moins de 8 TND", "أقل من 8"
  const priceMatch = message.match(
    /(?:under|less than|moins de|أقل من|max|maximum)\s*(\d+(?:[.,]\d+)?)\s*(?:tnd|dt|دينار)?/i
  );
  if (priceMatch) {
    filters.maxPrice = parseFloat(priceMatch[1].replace(',', '.'));
  }

  // Temperature: "iced", "cold", "hot", "glacé", "froid", "chaud"
  if (/\b(iced|cold brew|glacé|froid|frozen)\b/i.test(message)) {
    filters.temperature = 'iced';
  } else if (/\b(hot|chaud|warm|tiède)\b/i.test(message)) {
    filters.temperature = 'hot';
  }

  // Dietary flags: vegan, gluten-free, dairy-free, etc.
  const dietaryKeywords = {
    vegan:         /\b(vegan|végane?)\b/i,
    'gluten-free': /\b(gluten.?free|sans gluten|بدون غلوتين)\b/i,
    'dairy-free':  /\b(dairy.?free|sans lait|lactose)\b/i,
    'sugar-free':  /\b(sugar.?free|sans sucre)\b/i,
  };
  for (const [tag, re] of Object.entries(dietaryKeywords)) {
    if (re.test(message)) {
      if (!filters.dietaryTag) filters.dietaryTag = tag;
    }
  }

  return filters;
}

// ─── 2. Data fetching ────────────────────────────────────────────────────────

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

  const query = `
    SELECT p.*, c.name AS category_name, c.type AS category_type
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.id
  `;
  const result = await pool.query(query, values);
  return result.rows;
}

async function fetchFaqs() {
  try {
    const res = await pool.query(
      `SELECT * FROM faqs WHERE embedding IS NOT NULL ORDER BY id`
    );
    return res.rows;
  } catch {
    return [];
  }
}

// ─── 3. Ranking ──────────────────────────────────────────────────────────────

function rankBySimilarity(queryEmbedding, rows, topK) {
  return rows
    .map((r) => ({ ...r, similarity: cosineSimilarity(queryEmbedding, r.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// ─── 4. Context builders ─────────────────────────────────────────────────────

function buildProductContext(products) {
  return products
    .map((p, i) => {
      const lines = [
        `[Item ${i + 1}] ${p.name}${p.name_en ? ` / ${p.name_en}` : ''}`,
        `  Category: ${p.category_name}`,
        `  Price: ${parseFloat(p.price).toFixed(3)} TND`,
      ];
      if (p.description)    lines.push(`  Description: ${p.description}`);
      if (p.temperature)    lines.push(`  Temperature: ${p.temperature}`);
      if (p.dietary_tags?.length)  lines.push(`  Dietary: ${p.dietary_tags.join(', ')}`);
      if (p.allergens?.length)     lines.push(`  Allergens: ${p.allergens.join(', ')}`);
      if (p.is_trending)    lines.push(`  Note: Trending item`);
      if (p.is_seasonal)    lines.push(`  Note: Seasonal item`);
      return lines.join('\n');
    })
    .join('\n\n');
}

function buildFaqContext(faqs) {
  return faqs
    .map((f) => `[FAQ] Q: ${f.question}\n       A: ${f.answer}`)
    .join('\n\n');
}

// ─── 5. Prompt builder ───────────────────────────────────────────────────────

function buildPrompt({ productContext, faqContext, history, preferences, message }) {
  const prefLines = [];
  if (preferences?.milk_type)          prefLines.push(`- Preferred milk: ${preferences.milk_type}`);
  if (preferences?.budget_limit)       prefLines.push(`- Budget: under ${preferences.budget_limit} TND`);
  if (preferences?.dietary_tags?.length) prefLines.push(`- Dietary: ${preferences.dietary_tags.join(', ')}`);
  if (preferences?.language)           prefLines.push(`- Language preference: ${preferences.language}`);

  const historyText = (history || [])
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Luna'}: ${m.content}`)
    .join('\n');

  const faqSection = faqContext
    ? `\nFREQUENTLY ASKED QUESTIONS (use these for operational queries):\n${faqContext}\n`
    : '';

  return `You are Luna, a friendly virtual barista at BrewLuna café in Monastir, Tunisia.

RULES:
- Respond ONLY in the same language the customer is using (Arabic, French, or English).
- ONLY recommend items from the MENU CONTEXT below. Never invent products.
- For operational questions (hours, WiFi, delivery, etc.), use the FAQ section if available.
- If the customer asks something unrelated to the café, politely redirect them.
- If you are not confident, say so honestly rather than guessing.
- Keep responses concise and warm — you are a barista, not a search engine.
- Prices are in Tunisian Dinar (TND).
- Mention allergens or dietary info when relevant to the customer's request.

CUSTOMER PREFERENCES (remembered this session):
${prefLines.length ? prefLines.join('\n') : '- None recorded yet'}

MENU CONTEXT (most relevant items):
${productContext}
${faqSection}
CONVERSATION HISTORY:
${historyText || '(start of conversation)'}

Customer: ${message}
Luna:`;
}

// ─── 6. Main query function ──────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.message     - The customer's raw message
 * @param {Array}  params.history     - Prior messages [{ role, content }]
 * @param {object} params.preferences - Session preferences from chat_preferences
 * @returns {Promise<{ response, sources, confidence, low_confidence, response_ms }>}
 */
async function query({ message, history = [], preferences = {} }) {
  const startTime = Date.now();

  const filters = extractFilters(message);

  // Embed query + fetch products + fetch FAQs — all in parallel
  const [queryEmbedding, products, faqs] = await Promise.all([
    embed(message),
    fetchProducts(filters),
    fetchFaqs(),
  ]);

  if (products.length === 0) {
    return {
      response: "I'm sorry, I couldn't find any matching items on our menu right now.",
      sources: [],
      confidence: 0,
      low_confidence: true,
      response_ms: Date.now() - startTime,
    };
  }

  const topProducts = rankBySimilarity(queryEmbedding, products, TOP_K_PRODUCTS);
  const confidence = topProducts[0]?.similarity ?? 0;

  // Include FAQs only when the top FAQ is reasonably relevant
  const topFaqs = faqs.length
    ? rankBySimilarity(queryEmbedding, faqs, TOP_K_FAQS).filter(
        (f) => f.similarity >= FAQ_SIMILARITY_THRESHOLD
      )
    : [];

  const productContext = buildProductContext(topProducts);
  const faqContext = topFaqs.length ? buildFaqContext(topFaqs) : null;
  const prompt = buildPrompt({ productContext, faqContext, history, preferences, message });

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       CHAT_MODEL,
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens:  600,
    }),
  });
  if (!groqRes.ok) {
    const detail = await groqRes.text().catch(() => '');
    throw new Error(`Groq API error ${groqRes.status}: ${detail}`);
  }
  const groqData = await groqRes.json();
  const response = groqData.choices[0].message.content.trim();

  const sources = topProducts.map((p) => ({
    product_id: p.id,
    name: p.name,
    price: p.price,
    similarity: parseFloat(p.similarity.toFixed(4)),
  }));

  return {
    response,
    sources,
    confidence: parseFloat(confidence.toFixed(4)),
    low_confidence: confidence < LOW_CONFIDENCE_THRESHOLD,
    response_ms: Date.now() - startTime,
  };
}

module.exports = { query };
