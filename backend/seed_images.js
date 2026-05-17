const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'coffee_shop',
  user: 'postgres',
  password: '0000'
});

const categoryImages = {
  'Cafés Chauds': [
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1461023058943-07cb1499c05d?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'  
  ],
  'Boissons Chaudes': [
    'https://images.unsplash.com/photo-1542461734-71649987ce38?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1513281358985-78eb13ceaa6c?auto=format&fit=crop&w=800&q=80', 
  ],
  'Cafés Glacés': [
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80', 
  ],
  'Boissons Froides': [
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', 
  ],
  'Thés & Infusions': [
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1544787219-7f47ccb7fae6?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1563822249548-9a72b6353cad?auto=format&fit=crop&w=800&q=80', 
  ],
  'Pâtisseries & Desserts': [
    'https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80', 
  ],
  'Plats & Sandwichs': [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', 
  ],
  'Combos & Formules': [
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80', 
  ]
};

async function seed() {
  try {
    const res = await pool.query('SELECT p.id, p.name, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id');
    const products = res.rows;
    
    let updated = 0;
    for (const p of products) {
      const images = categoryImages[p.category_name] || categoryImages['Cafés Chauds'];
      // Deterministic selection based on ID to ensure consistent assignment
      const imageIndex = p.id % images.length;
      const selectedImage = images[imageIndex];
      await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [selectedImage, p.id]);
      updated++;
    }
    console.log(`Successfully updated images for ${updated} products.`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
