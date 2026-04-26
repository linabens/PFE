const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrateGames() {
  const client = await pool.connect();
  try {
    console.log('🔄 Migration des tables de jeux...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema-games.sql'), 'utf-8');

    // Split on semicolons (respecting dollar-quoted blocks)
    const statements = [];
    let current = '';
    for (let i = 0; i < schema.length; i++) {
      if (schema[i] === ';') {
        if (current.trim()) statements.push(current.trim());
        current = '';
      } else {
        current += schema[i];
      }
    }

    for (const stmt of statements) {
      if (stmt) await client.query(stmt);
    }

    console.log('✅ Tables de jeux créées avec succès!');
  } catch (err) {
    console.error('❌ Erreur migration jeux:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateGames().then(() => process.exit(0)).catch(() => process.exit(1));
}
module.exports = migrateGames;
