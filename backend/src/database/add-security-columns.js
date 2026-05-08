const pool = require('./pool');

async function updateUsersTable() {
  console.log('Updating users table to include security question columns...');
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question TEXT');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer TEXT');
    console.log('Success: security columns added.');
  } catch (err) {
    console.error('Error updating users table:', err);
  } finally {
    process.exit();
  }
}

updateUsersTable();
