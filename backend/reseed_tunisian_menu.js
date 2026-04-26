require('dotenv').config();
const pool = require('./src/database/pool');

const categories = [
  { name: 'Cafés Chauds', type: 'drink' },
  { name: 'Cafés Glacés', type: 'drink' },
  { name: 'Frappuccinos', type: 'drink' },
  { name: 'Smoothies & Jus', type: 'drink' },
  { name: 'Matcha & Latté', type: 'drink' },
  { name: 'Pâtisseries', type: 'dessert' }
];

const products = [
  // Cafés Chauds
  { category: 'Cafés Chauds', name: 'Espresso Ristretto', price: 2.500, desc: 'Un espresso court et intense, l’essence même du café.', trending: true, seasonal: false, img: 'https://images.unsplash.com/photo-1510707577719-af7c183f1e59?auto=format&fit=crop&q=80&w=800' },
  { category: 'Cafés Chauds', name: 'Capucin', price: 2.800, desc: 'Le grand classique : espresso avec une touche de lait mousseux onctueux.', trending: true, seasonal: false, img: 'https://images.unsplash.com/photo-1534706936160-d5ee67737249?auto=format&fit=crop&q=80&w=800' },
  { category: 'Cafés Chauds', name: 'Café Direct', price: 3.200, desc: 'Allongé avec du lait chaud, idéal pour bien commencer la journée.', trending: false, seasonal: false, img: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=800' },
  { category: 'Cafés Chauds', name: 'Americano', price: 4.500, desc: 'Espresso pur allongé à l’eau chaude pour une saveur équilibrée.', trending: false, seasonal: false, img: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&q=80&w=800' },
  { category: 'Cafés Chauds', name: 'Cappuccino Italien', price: 5.500, desc: 'Espresso, lait chaud et mousse de lait épaisse saupoudré de cacao.', trending: false, seasonal: false, img: 'https://images.unsplash.com/photo-1575916140220-b38871bd8d58?auto=format&fit=crop&q=80&w=800' },
  
  // Cafés Glacés
  { category: 'Cafés Glacés', name: 'Iced Vanilla Latte', price: 7.500, desc: 'Mélange rafraîchissant d’espresso, lait frais et sirop de vanille.', trending: true, seasonal: false, img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=800' },
  { category: 'Cafés Glacés', name: 'Signature Cold Brew', price: 8.000, desc: 'Infusé à froid pendant 16h pour une douceur naturelle sans amertume.', trending: false, seasonal: true, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800' },
  
  // Frappuccinos
  { category: 'Frappuccinos', name: 'Caramel Macchiato Frappé', price: 9.500, desc: 'Café mixé avec glace, chantilly généreuse et coulis de caramel.', trending: true, seasonal: false, img: 'https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?auto=format&fit=crop&q=80&w=800' },
  { category: 'Frappuccinos', name: 'Oreo Dream Frappé', price: 10.500, desc: 'Gourmandise absolue aux biscuits Oreo, chocolat et crème chantilly.', trending: true, seasonal: false, img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800' },

  // Smoothies & Jus
  { category: 'Smoothies & Jus', name: 'Citronnade Fraîche', price: 5.500, desc: 'Citrons pressés, menthe fraîche et une touche de sucre.', trending: true, seasonal: true, img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800' },
  { category: 'Smoothies & Jus', name: 'Mango Sunshine', price: 8.500, desc: 'Smoothie à la mangue fraîche pour une explosion de saveurs fruitées.', trending: false, seasonal: false, img: 'https://images.unsplash.com/photo-1550592704-6c76defa9985?auto=format&fit=crop&q=80&w=800' },

  // Matcha
  { category: 'Matcha & Latté', name: 'Matcha Latte Premium', price: 9.000, desc: 'Thé vert matcha de cérémonie préparé avec un lait onctueux.', trending: true, seasonal: false, img: 'https://images.unsplash.com/photo-1536304953466-4835025ea5b2?auto=format&fit=crop&q=80&w=800' },

  // Pâtisseries
  { category: 'Pâtisseries', name: 'Croissant au Beurre', price: 2.500, desc: 'Pâtisserie française classique, croustillante et dorée.', trending: false, seasonal: false, img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800' },
  { category: 'Pâtisseries', name: 'Pain au Chocolat', price: 2.800, desc: 'Feuilletage pur beurre avec deux barres de chocolat noir intense.', trending: false, seasonal: false, img: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&q=80&w=800' }
];

async function reseed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🗑️ Cleaning old data...');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    console.log('🌱 Seeding new categories...');
    const catMap = {};
    for (const cat of categories) {
      const res = await client.query(
        'INSERT INTO categories (name, type) VALUES ($1, $2) RETURNING id',
        [cat.name, cat.type]
      );
      catMap[cat.name] = res.rows[0].id;
    }

    console.log('☕ Seeding refreshed menu products...');
    for (const p of products) {
      await client.query(
        `INSERT INTO products (category_id, name, description, price, image_url, is_trending, is_seasonal, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [catMap[p.category], p.name, p.desc, p.price, p.img, p.trending, p.seasonal, true]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Tunisia/Mix menu overhaul complete!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Reseed failed:', e.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

reseed();
