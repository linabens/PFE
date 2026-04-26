const pool = require('./pool');
const bcrypt = require('bcrypt');

async function directSeed() {
  console.log('🚀 Starting direct seed...');
  
  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    
    // Clear existing (optional but safer)
    await pool.query('DELETE FROM users WHERE email = \'admin@coffee.com\'');
    
    // 1. Admin User
    await pool.query(`
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ('Admin Manager', 'admin@coffee.com', $1, 'admin')
    `, [adminHash]);
    console.log('✅ Admin user created: admin@coffee.com / admin123');
    
    // 2. Tables
    await pool.query('INSERT INTO tables (table_number, qr_code, is_active) VALUES (1, \'T1\', true), (2, \'T2\', true), (3, \'T3\', true) ON CONFLICT DO NOTHING');
    console.log('✅ Tables created');

    // 3. Categories
    const catResult = await pool.query(`
      INSERT INTO categories (name, type, display_order)
      VALUES 
        ('Coffee', 'drink', 1),
        ('Dessert', 'dessert', 2)
      ON CONFLICT (name) DO UPDATE SET type = EXCLUDED.type
      RETURNING id, name
    `);
    console.log('✅ Categories created');
    
    const coffeeId = catResult.rows.find(r => r.name === 'Coffee')?.id;
    if (coffeeId) {
      await pool.query(`
        INSERT INTO products (category_id, name, description, price, is_active, is_trending)
        VALUES ($1, 'Espresso', 'Pure intensity', 3.5, true, true)
        ON CONFLICT DO NOTHING
      `, [coffeeId]);
      console.log('✅ Sample product created');
    }

    console.log('🌟 Direct seed finished successfully!');
  } catch (err) {
    console.error('❌ Direct seed FAILED:', err);
  } finally {
    await pool.end();
  }
}

directSeed();
