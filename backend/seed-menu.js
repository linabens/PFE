/**
 * seed-menu.js
 * 1. Expands the category_type ENUM to support more types
 * 2. Clears and re-seeds categories + products with a clean, full coffee menu.
 * Usage: node seed-menu.js
 */

const pool = require('./src/database/pool');

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Signature Blends', type: 'drink', display_order: 1 },
  { name: 'Single Origin', type: 'drink', display_order: 2 },
  { name: 'Cold Drip & Nitro', type: 'drink', display_order: 3 },
  { name: 'Artisan Pastries', type: 'dessert', display_order: 4 },
  { name: 'Luxury Brunch', type: 'food', display_order: 5 },
];

// ─── Products (category matched by display_order index) ──────────────────────
const PRODUCTS = [
  // ── Signature Blends ────────────────────────────────────────────────────────
  { cat: 0, name: 'Gold Dust Espresso', description: 'Double shot of our house blend with edible gold flakes', price: 12.00, trending: true, image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&q=80&w=400' },
  { cat: 0, name: 'Velvet Latte', description: 'Micro-foamed milk with Madagascar vanilla bean', price: 8.50, trending: true, image: 'https://images.unsplash.com/photo-1561882468-9110d70b2187?auto=format&fit=crop&q=80&w=400' },
  { cat: 0, name: 'Caramel Silk Macchiato', description: 'Layered espresso with house-made salted caramel', price: 9.00, trending: false, image: 'https://images.unsplash.com/photo-1485808191679-5f86510bd652?auto=format&fit=crop&q=80&w=400' },

  // ── Single Origin ───────────────────────────────────────────────────────────
  { cat: 1, name: 'Ethiopian Yirgacheffe', description: 'Floral notes with a hit of jasmine and lemon', price: 10.50, trending: false, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400' },
  { cat: 1, name: 'Sumatra Mandheling', description: 'Earthy, full-bodied with a smooth herbal finish', price: 11.00, trending: true, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&q=80&w=400' },

  // ── Cold Drip & Nitro ───────────────────────────────────────────────────────
  { cat: 2, name: '24h Gold Cold Brew', description: 'Slow-dripped for 24 hours, served over a crystal sphere', price: 14.00, trending: true, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=400' },
  { cat: 2, name: 'Nitro Silk Stout', description: 'Nitro-infused cold brew with a creamy, stout-like head', price: 9.50, trending: false, image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&q=80&w=400' },

  // ── Artisan Pastries ────────────────────────────────────────────────────────
  { cat: 3, name: 'Saffron Pistachio Croissant', description: 'Hand-laminated with premium Iranian saffron', price: 7.00, trending: true, image: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?auto=format&fit=crop&q=80&w=400' },
  { cat: 3, name: 'Truffle Dark Chocolate Pain', description: 'Infused with black truffle oil and 70% cacao', price: 8.50, trending: false, image: 'https://images.unsplash.com/photo-1585631664524-0a2a68d30862?auto=format&fit=crop&q=80&w=400' },

  // ── Luxury Brunch ───────────────────────────────────────────────────────────
  { cat: 4, name: 'Caviar Avocado Toast', description: 'Smashed avocado topped with Beluga caviar', price: 28.00, trending: true, image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=400' },
  { cat: 4, name: 'Wagyu Steak & Eggs', description: 'A5 Wagyu strips with organic poached eggs', price: 45.00, trending: true, image: 'https://images.unsplash.com/photo-1528207772081-346766432f83?auto=format&fit=crop&q=80&w=400' },
];


// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    // 0. Expand ENUM if needed
    console.log('🔄 Checking ENUM types…');
    // We try to add 'food' to category_type. 
    // In Postgres, we can't do this inside a transaction (BEGIN/COMMIT) for some versions,
    // and we definitely can't do it comfortably with IF NOT EXISTS in old ones.
    // However, we'll try a safe approach or just run it before BEGIN.
    await client.query('COMMIT'); // End the initial BEGIN if we started one
    try {
      await client.query("ALTER TYPE category_type ADD VALUE IF NOT EXISTS 'food'");
    } catch (e) {
      // Ignore if already exists or other non-critical error
    }
    await client.query('BEGIN');

    // 1. Wipe existing products & categories
    console.log('🗑  Clearing old products and categories…');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    // 2. Insert categories
    console.log('📂 Inserting categories…');
    const catIds = [];
    for (const cat of CATEGORIES) {
      const res = await client.query(
        'INSERT INTO categories (name, type, display_order) VALUES ($1,$2,$3) RETURNING id',
        [cat.name, cat.type, cat.display_order]
      );
      catIds.push(res.rows[0].id);
      console.log(`   ✓ ${cat.name} (id=${res.rows[0].id}, type=${cat.type})`);
    }

    // 3. Insert products
    console.log('\n☕ Inserting products…');
    for (const p of PRODUCTS) {
      const catId = catIds[p.cat];
      await client.query(
        `INSERT INTO products (name, description, price, image_url, category_id, is_active, is_trending, is_seasonal)
         VALUES ($1,$2,$3,$4,$5,true,$6,false)`,
        [p.name, p.description, p.price, p.image, catId, p.trending]
      );
      const flag = p.trending ? '🔥' : '  ';
      console.log(`   ${flag} ${p.name.padEnd(20)} — ${p.price.toFixed(2)} TND`);
    }

    await client.query('COMMIT');
    console.log(`\n✅ Done! ${CATEGORIES.length} categories and ${PRODUCTS.length} products seeded.`);
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error — rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
