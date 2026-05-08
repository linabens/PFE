const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrateChat() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running chat module migration...');
    console.log('   → Adding embedding column to products (FLOAT[])');
    console.log('   → Creating chat_messages table');
    console.log('   → Creating chat_preferences table');

    const schema = fs.readFileSync(path.join(__dirname, 'schema-chat.sql'), 'utf-8');

    // Split on semicolons, respecting dollar-quoted blocks
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';

    for (let i = 0; i < schema.length; i++) {
      const char = schema[i];

      if (char === '$' && !inDollarQuote) {
        const match = schema.substring(i).match(/^\$(\w*)\$/);
        if (match) {
          dollarQuoteTag = match[0];
          inDollarQuote = true;
          current += match[0];
          i += match[0].length - 1;
          continue;
        }
      } else if (inDollarQuote && schema.substring(i).startsWith(dollarQuoteTag)) {
        inDollarQuote = false;
        current += dollarQuoteTag;
        i += dollarQuoteTag.length - 1;
        continue;
      }

      if (char === ';' && !inDollarQuote) {
        if (current.trim()) statements.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) statements.push(current.trim());

    for (const stmt of statements) {
      if (stmt) await client.query(stmt);
    }

    console.log('✅ Chat module migration completed successfully!');
    console.log('');
    console.log('Next step → run: npm run embed:products');
    console.log('  This will vectorize all products and populate the embedding column.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateChat().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrateChat;
