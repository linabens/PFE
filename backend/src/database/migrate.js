const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Démarrage de la migration de la base de données...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute entire schema - PostgreSQL client will handle multi-statement parsing
    const statements = [];
    let current = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';
    
    for (let i = 0; i < schema.length; i++) {
      const char = schema[i];
      const next3 = schema.substring(i, i + 3);
      
      // Check for dollar quotes
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
      
      // Split on semicolon only outside dollar quotes
      if (char === ';' && !inDollarQuote) {
        if (current.trim()) {
          statements.push(current);
        }
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      statements.push(current);
    }
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await client.query(stmt);
        } catch (error) {
          console.error(`❌ Error in statement ${i + 1}:`);
          console.error(`First 100 chars: ${stmt.substring(0, 100)}...`);
          throw error;
        }
      }
    }
    
    console.log('✅ Migration terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = migrate;

