const pool = require('./pool');

async function updateUsersTable() {
  console.log('Updating users table to include avatar column...');
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT');
    console.log('Success: avatar column added (or already exists).');
  } catch (err) {
    console.error('Error updating users table:', err);
  } finally {
    process.exit();
  }
}

updateUsersTable();
