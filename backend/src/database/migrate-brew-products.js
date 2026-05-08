require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrateBrewProducts() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running BrewLuna products schema migration...');
    console.log('   → Extending category_type enum (coffee, cold, special, food)');
    console.log('   → Adding rich metadata columns to products table');
    console.log('   → Creating faqs table');
    console.log('');

    const schema = fs.readFileSync(path.join(__dirname, 'schema-brew-products.sql'), 'utf-8');

    // Split on semicolons. For each chunk, strip comment lines first so that
    // a leading comment block doesn't cause the real SQL to be filtered out.
    // ALTER TYPE ADD VALUE cannot run inside a transaction — each statement
    // is executed separately in autocommit mode (no BEGIN/COMMIT wrapper).
    const statements = schema
      .split(';')
      .map((chunk) =>
        chunk
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
      )
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        // "already exists" errors are safe to ignore
        if (err.message.includes('already exists')) {
          console.log(`   ⚠️  Skipped (already exists): ${stmt.substring(0, 60)}...`);
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next step → run: npm run seed:brew');
    console.log('  This will import all 70 BrewLuna products into the database.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateBrewProducts().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateBrewProducts;
