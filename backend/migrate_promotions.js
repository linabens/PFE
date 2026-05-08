require('dotenv').config();
const pool = require('./src/database/pool');

async function runMigration() {
  const sql = `
    CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      subtitle VARCHAR(255),
      tag VARCHAR(50),
      image_url VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('🔄 Creating promotions table (local mode)...');
    await pool.query(sql);
    console.log('✅ TABLE_CREATED');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration Error:', e.message);
    process.exit(1);
  }
}

runMigration();
