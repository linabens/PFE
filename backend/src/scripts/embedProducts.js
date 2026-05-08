/**
 * embed:products — indexes all active products and FAQs with Gemini embeddings.
 *
 * For each product it:
 *   1. Builds a rich text document (name, description, category, price, options,
 *      dietary tags, allergens, ingredients, temperature, pairings, keywords)
 *   2. Calls Gemini text-embedding-004 to get a 768-dim float vector
 *   3. Stores the vector in products.embedding
 *
 * For each FAQ it builds a question+answer document and stores it in faqs.embedding.
 *
 * Run with: npm run embed:products
 * Safe to re-run — embeddings are always refreshed.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../database/pool');
const { embed } = require('../services/EmbeddingService');

// Free tier allows 1,500 req/min — 100ms keeps us comfortably under.
const DELAY_MS = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Product document builder ─────────────────────────────────────────────────

function buildProductDocument(product, options) {
  const lines = [];

  lines.push(`Product: ${product.name}`);
  if (product.name_en) lines.push(`English name: ${product.name_en}`);
  lines.push(`Category: ${product.category_name}`);
  lines.push(`Price: ${parseFloat(product.price).toFixed(3)} TND`);

  if (product.description)    lines.push(`Description: ${product.description}`);
  if (product.description_en) lines.push(`Description (EN): ${product.description_en}`);

  if (product.temperature)      lines.push(`Temperature: ${product.temperature}`);
  if (product.preparation_time) lines.push(`Preparation: ${product.preparation_time}`);

  const flags = [];
  if (product.is_trending) flags.push('trending');
  if (product.is_seasonal) flags.push('seasonal');
  if (flags.length) lines.push(`Tags: ${flags.join(', ')}`);

  if (product.dietary_tags?.length) {
    lines.push(`Dietary: ${product.dietary_tags.join(', ')}`);
  }
  if (product.allergens?.length) {
    lines.push(`Allergens: ${product.allergens.join(', ')}`);
  }
  if (product.ingredients?.length) {
    lines.push(`Ingredients: ${product.ingredients.join(', ')}`);
  }

  if (product.keywords?.length) {
    lines.push(`Keywords: ${product.keywords.join(', ')}`);
  }

  if (product.metadata?.popular_pairings?.length) {
    lines.push(`Pairs well with: ${product.metadata.popular_pairings.join(', ')}`);
  }

  if (options.size?.length) {
    lines.push(`Sizes: ${options.size.map((o) => o.name).join(', ')}`);
  }
  if (options.milk?.length) {
    lines.push(`Milk options: ${options.milk.map((o) => o.name).join(', ')}`);
  }
  if (options.sugar?.length) {
    lines.push(`Sweetness: ${options.sugar.map((o) => o.name).join(', ')}`);
  }
  if (options.addon?.length) {
    lines.push(`Add-ons: ${options.addon.map((o) => `${o.name} (+${parseFloat(o.price_modifier).toFixed(3)} TND)`).join(', ')}`);
  }

  return lines.join('\n');
}

// ─── FAQ document builder ─────────────────────────────────────────────────────

function buildFaqDocument(faq) {
  const lines = [];
  lines.push(`FAQ: ${faq.question}`);
  if (faq.question_en) lines.push(`FAQ (EN): ${faq.question_en}`);
  if (faq.category) lines.push(`Category: ${faq.category}`);
  lines.push(`Answer: ${faq.answer}`);
  return lines.join('\n');
}

// ─── Data loaders ─────────────────────────────────────────────────────────────

async function loadProductsWithOptions() {
  const productsRes = await pool.query(`
    SELECT p.*, c.name AS category_name, c.type AS category_type
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
    ORDER BY p.id
  `);

  const optionsRes = await pool.query(
    `SELECT * FROM product_options ORDER BY product_id, option_type, name`
  );

  const optionsByProduct = {};
  for (const opt of optionsRes.rows) {
    if (!optionsByProduct[opt.product_id]) {
      optionsByProduct[opt.product_id] = { size: [], milk: [], sugar: [], addon: [] };
    }
    optionsByProduct[opt.product_id][opt.option_type]?.push(opt);
  }

  return productsRes.rows.map((p) => ({
    product: p,
    options: optionsByProduct[p.id] || { size: [], milk: [], sugar: [], addon: [] },
  }));
}

async function loadFaqs() {
  const res = await pool.query(`SELECT * FROM faqs ORDER BY id`);
  return res.rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  let total = 0;
  let failed = 0;

  // ── Products ────────────────────────────────────────────────────────────────
  console.log('🔍 Loading products from database...');
  const items = await loadProductsWithOptions();
  console.log(`   Found ${items.length} active products\n`);

  for (let i = 0; i < items.length; i++) {
    const { product, options } = items[i];
    const label = `[${i + 1}/${items.length}] ${product.name}`;
    try {
      const doc = buildProductDocument(product, options);
      const vector = await embed(doc);
      await pool.query(
        `UPDATE products SET embedding = $1, embedding_updated_at = NOW() WHERE id = $2`,
        [`{${vector.join(',')}}`, product.id]
      );
      console.log(`  ✅ ${label}`);
      total++;
    } catch (err) {
      console.error(`  ❌ ${label} — ${err.message}`);
      failed++;
    }
    if (i < items.length - 1) await sleep(DELAY_MS);
  }

  // ── FAQs ────────────────────────────────────────────────────────────────────
  let faqs = [];
  try {
    faqs = await loadFaqs();
  } catch {
    console.log('\n⚠️  faqs table not found — run npm run db:migrate-brew first\n');
  }

  if (faqs.length > 0) {
    console.log(`\n🔍 Embedding ${faqs.length} FAQs...\n`);
    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];
      const label = `[FAQ ${i + 1}/${faqs.length}] ${faq.question.substring(0, 50)}`;
      try {
        const doc = buildFaqDocument(faq);
        const vector = await embed(doc);
        await pool.query(
          `UPDATE faqs SET embedding = $1, embedding_updated_at = NOW() WHERE id = $2`,
          [`{${vector.join(',')}}`, faq.id]
        );
        console.log(`  ✅ ${label}`);
        total++;
      } catch (err) {
        console.error(`  ❌ ${label} — ${err.message}`);
        failed++;
      }
      if (i < faqs.length - 1) await sleep(DELAY_MS);
    }
  }

  console.log(`\n📊 Done: ${total} embedded, ${failed} failed`);
  if (total > 0) {
    console.log('\n✅ Products and FAQs are now searchable by the RAG chatbot.');
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
