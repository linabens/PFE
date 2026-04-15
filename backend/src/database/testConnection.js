const pool = require('./pool');

async function testConnection() {
  try {
    console.log('🔌 Test de connexion à la base de données...');
    console.log('Configuration:', {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'coffeeshop',
      user: process.env.DB_USER || 'postgres',
    });
    
    const client = await pool.connect();
    console.log('✅ Connexion réussie!');
    
    // Test simple
    const result = await client.query('SELECT NOW()');
    console.log('✅ Requête test réussie:', result.rows[0]);
    
    client.release();
    await pool.end();
    
    console.log('✅ Tous les tests passés!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('Détails:', {
      code: error.code,
      detail: error.detail,
    });
    process.exit(1);
  }
}

testConnection();

