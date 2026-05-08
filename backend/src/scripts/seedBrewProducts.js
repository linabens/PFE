/**
 * seed:brew — imports the full BrewLuna product database into PostgreSQL.
 *
 * What it does:
 *   1. Clears existing products, options, categories, and FAQs
 *   2. Inserts 8 categories
 *   3. Inserts 70 products with all metadata columns
 *   4. Parses sizes → product_options (size)
 *   5. Parses customizations → product_options (milk / sugar / addon)
 *   6. Inserts 8 FAQs
 *
 * Run with: npm run seed:brew
 * WARNING: Deletes all existing products and categories. Safe on dev/staging only.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../database/pool');
const data = require('../data/brewluna_products.json');

const CATEGORY_MAP = {
  hot_coffee:  { name: 'Cafés Chauds',           type: 'coffee',  display_order: 1 },
  iced_coffee: { name: 'Cafés Glacés',            type: 'cold',    display_order: 2 },
  tea:         { name: 'Thés & Infusions',         type: 'coffee',  display_order: 3 },
  hot_drinks:  { name: 'Boissons Chaudes',         type: 'coffee',  display_order: 4 },
  cold_drinks: { name: 'Boissons Froides',         type: 'cold',    display_order: 5 },
  pastry:      { name: 'Pâtisseries & Desserts',   type: 'special', display_order: 6 },
  savory:      { name: 'Plats & Sandwichs',        type: 'food',    display_order: 7 },
  combos:      { name: 'Combos & Formules',        type: 'special', display_order: 8 },
};

const SIZE_LABELS = {
  single: 'Single', double: 'Double',
  small: 'Small', medium: 'Medium', large: 'Large',
};

/**
 * Parses a customization string like "Lait d'avoine (+0.5 TND)" into
 * { name: "Lait d'avoine", price_modifier: 0.5 }.
 */
function parseOptionString(raw) {
  if (typeof raw !== 'string') return null;

  const addMatch = raw.match(/\(\+(\d+(?:\.\d+)?)\s*TND\)/);
  if (addMatch) {
    return {
      name: raw.replace(/\s*\(\+[^)]+\)/, '').trim(),
      price_modifier: parseFloat(addMatch[1]),
    };
  }

  const subMatch = raw.match(/\(-(\d+(?:\.\d+)?)\s*TND\)/);
  if (subMatch) {
    return {
      name: raw.replace(/\s*\(-[^)]+\)/, '').trim(),
      price_modifier: -parseFloat(subMatch[1]),
    };
  }

  // "(gratuit)", "(standard)", "(inclus)", etc. → price 0, strip the parenthetical
  return {
    name: raw.replace(/\s*\([^)]+\)/, '').trim(),
    price_modifier: 0,
  };
}

async function run() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding BrewLuna database...\n');

    // ── 1. Clear existing data (FK-safe order) ───────────────────────────────
    await client.query('DELETE FROM product_options');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM faqs');
    console.log('✅ Cleared existing products, categories, and FAQs\n');

    // ── 2. Insert categories ─────────────────────────────────────────────────
    const categoryIds = {};
    for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
      const res = await client.query(
        `INSERT INTO categories (name, type, display_order) VALUES ($1, $2, $3) RETURNING id`,
        [cat.name, cat.type, cat.display_order]
      );
      categoryIds[key] = res.rows[0].id;
    }
    console.log(`✅ Inserted ${Object.keys(CATEGORY_MAP).length} categories\n`);

    // ── 3. Insert products + options ─────────────────────────────────────────
    let productCount = 0;
    let optionCount = 0;

    for (const p of data.products) {
      const categoryId = categoryIds[p.category];
      if (!categoryId) {
        console.warn(`⚠️  Unknown category "${p.category}" for "${p.name}" — skipped`);
        continue;
      }

      const isPopular = (p.popularity_score || 0) >= 0.90;

      const metadata = {
        nutritional_info:  p.nutritional_info  || null,
        popular_pairings:  p.popular_pairings  || [],
        available_hours:   p.available_hours   || null,
        subcategory:       p.subcategory       || null,
        includes:          p.includes          || null,  // combos bundle list
        original_price:    p.original_price    || null,
        savings:           p.savings           || null,
      };

      const res = await client.query(
        `INSERT INTO products (
          category_id, name, name_en,
          description, description_en,
          price, is_active, is_seasonal, is_trending,
          dietary_tags, allergens, ingredients,
          temperature, preparation_time, popularity_score,
          keywords, metadata
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,$17
        ) RETURNING id`,
        [
          categoryId,
          p.name,
          p.name_en    || null,
          p.description    || null,
          p.description_en || null,
          p.price,
          p.available !== false,
          false,
          isPopular,
          p.dietary_tags?.length  ? p.dietary_tags  : null,
          p.allergens?.length     ? p.allergens     : null,
          p.ingredients?.length   ? p.ingredients   : null,
          p.temperature           || null,
          p.preparation_time      || null,
          p.popularity_score      || null,
          p.keywords?.length      ? p.keywords      : null,
          metadata,
        ]
      );
      const productId = res.rows[0].id;
      productCount++;

      // Size options: {"small": 4.0, "medium": 5.2, "large": 6.5}
      if (p.sizes && typeof p.sizes === 'object') {
        const basePrice = parseFloat(p.price);
        for (const [sizeKey, sizePrice] of Object.entries(p.sizes)) {
          const label = SIZE_LABELS[sizeKey] || (sizeKey[0].toUpperCase() + sizeKey.slice(1));
          const modifier = parseFloat((parseFloat(sizePrice) - basePrice).toFixed(3));
          await client.query(
            `INSERT INTO product_options (product_id, option_type, name, price_modifier)
             VALUES ($1, 'size', $2, $3)`,
            [productId, label, modifier]
          );
          optionCount++;
        }
      }

      // Milk options
      const milkRaw = p.customizations?.milk_options || [];
      for (const raw of milkRaw) {
        const opt = parseOptionString(raw);
        if (!opt) continue;
        await client.query(
          `INSERT INTO product_options (product_id, option_type, name, price_modifier)
           VALUES ($1, 'milk', $2, $3)`,
          [productId, opt.name, opt.price_modifier]
        );
        optionCount++;
      }

      // Sugar / sweetness options
      const sugarRaw = [
        ...(p.customizations?.sweetness_level || []),
        ...(p.customizations?.sweetness       || []),
      ];
      for (const raw of sugarRaw) {
        const opt = parseOptionString(raw);
        if (!opt) continue;
        await client.query(
          `INSERT INTO product_options (product_id, option_type, name, price_modifier)
           VALUES ($1, 'sugar', $2, $3)`,
          [productId, opt.name, opt.price_modifier]
        );
        optionCount++;
      }

      // Add-on extras
      const addonRaw = p.customizations?.extras || [];
      for (const raw of addonRaw) {
        const opt = parseOptionString(raw);
        if (!opt) continue;
        await client.query(
          `INSERT INTO product_options (product_id, option_type, name, price_modifier)
           VALUES ($1, 'addon', $2, $3)`,
          [productId, opt.name, opt.price_modifier]
        );
        optionCount++;
      }

      process.stdout.write(`  ✅ [${productCount.toString().padStart(2)}] ${p.name}\n`);
    }

    console.log(`\n✅ Inserted ${productCount} products, ${optionCount} options\n`);

    // ── 4. Insert FAQs ───────────────────────────────────────────────────────
    for (const faq of data.faqs) {
      await client.query(
        `INSERT INTO faqs (question, question_en, answer, category) VALUES ($1, $2, $3, $4)`,
        [faq.question, faq.question_en || null, faq.answer, faq.category || null]
      );
    }
    console.log(`✅ Inserted ${data.faqs.length} FAQs\n`);

    console.log('🎉 Seed complete!');
    console.log('   Next step → npm run embed:products');
    console.log('   (embeds all products + FAQs so the chatbot can search them)');
  } catch (err) {
    console.error('\n❌ Seed error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
