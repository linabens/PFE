const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrateStats() {
  const client = await pool.connect();
  try {
    console.log('🔄 Migration des corrections stats...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema-stats-fix.sql'), 'utf-8');

    // Split on semicolons carefully
    const statements = [];
    let current = '';
    let inDollar = false;
    for (let i = 0; i < schema.length; i++) {
      if (schema[i] === '$' && schema.substring(i, i+2) === '$$') {
        inDollar = !inDollar;
        current += '$$';
        i++;
        continue;
      }
      if (schema[i] === ';' && !inDollar) {
        if (current.trim()) statements.push(current.trim());
        current = '';
      } else {
        current += schema[i];
      }
    }

    for (const stmt of statements) {
      if (stmt && !stmt.startsWith('--')) {
        try {
          await client.query(stmt);
        } catch (e) {
          // Ignore "already exists" errors gracefully
          if (!e.message.includes('already exists') && !e.message.includes('duplicate')) {
            throw e;
          }
        }
      }
    }
    console.log('✅ Migration stats corrections réussie!');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateStats().then(() => process.exit(0)).catch(() => process.exit(1));
}
module.exports = migrateStats;
