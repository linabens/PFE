const pool = require('./pool');

/**
 * Drop all tables and reset database
 */
async function reset() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Démarrage du reset de la base de données...');
    
    // Drop all tables in reverse order of dependencies
    const dropStatements = [
      'DROP TABLE IF EXISTS loyalty_transactions CASCADE',
      'DROP TABLE IF EXISTS loyalty_accounts CASCADE',
      'DROP TABLE IF EXISTS daily_stats CASCADE',
      'DROP TABLE IF EXISTS daily_product_stats CASCADE',
      'DROP TABLE IF EXISTS assistance_requests CASCADE',
      'DROP TABLE IF EXISTS order_status_history CASCADE',
      'DROP TABLE IF EXISTS order_item_options CASCADE',
      'DROP TABLE IF EXISTS order_items CASCADE',
      'DROP TABLE IF EXISTS orders CASCADE',
      'DROP TABLE IF EXISTS game_scores CASCADE',
      'DROP TABLE IF EXISTS games CASCADE',
      'DROP TABLE IF EXISTS product_options CASCADE',
      'DROP TABLE IF EXISTS products CASCADE',
      'DROP TABLE IF EXISTS categories CASCADE',
      'DROP TABLE IF EXISTS sessions CASCADE',
      'DROP TABLE IF EXISTS tables CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TYPE IF EXISTS assistance_status CASCADE',
      'DROP TYPE IF EXISTS option_type_enum CASCADE',
      'DROP TYPE IF EXISTS order_status CASCADE',
      'DROP TYPE IF EXISTS category_type CASCADE',
      'DROP TYPE IF EXISTS user_role CASCADE',
    ];
    
    for (const stmt of dropStatements) {
      try {
        await client.query(stmt);
      } catch (error) {
        console.log(`  ⚠️  ${stmt} - ${error.message.substring(0, 50)}`);
      }
    }
    
    console.log('✅ Reset terminé!');
    
  } catch (error) {
    console.error('❌ Erreur lors du reset:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  reset()
    .then(() => {
      console.log('✅ Processus terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = reset;
