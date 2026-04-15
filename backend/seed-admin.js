/**
 * seed-admin.js
 * Run once to create an admin user in the database.
 * Usage: node seed-admin.js
 */

const bcrypt = require('bcrypt');
const pool = require('./src/database/pool');

const ADMIN = {
  full_name: 'Admin',
  email: 'admin@cafe.com',
  password: 'admin123',
  role: 'admin',
};

async function seed() {
  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [ADMIN.email]);
    if (existing.rows.length > 0) {
      console.log(`✅ User "${ADMIN.email}" already exists (id=${existing.rows[0].id}). No changes made.`);
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(ADMIN.password, 10);
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, email, role',
      [ADMIN.full_name, ADMIN.email, password_hash, ADMIN.role]
    );

    console.log('✅ Admin user created successfully!');
    console.log(`   Email   : ${result.rows[0].email}`);
    console.log(`   Password: ${ADMIN.password}`);
    console.log(`   Role    : ${result.rows[0].role}`);
    console.log(`   ID      : ${result.rows[0].id}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
    process.exit(1);
  }
}

seed();
