const pool = require('./pool');

async function updateTables() {
  const client = await pool.connect();
  try {
    console.log('🔄 Mise à jour des codes QR des tables pour le test...');
    // On ajoute l'URL Expo comme code QR pour la table 1 pour faciliter les tests
    await client.query(`
      UPDATE tables SET qr_code = 'exp://192.168.0.224:8081' WHERE table_number = 1;
      UPDATE tables SET qr_code = 'TABLE_2' WHERE table_number = 2;
      UPDATE tables SET qr_code = 'TABLE_3' WHERE table_number = 3;
    `);
    console.log('✅ Codes QR mis à jour (Table 1 = Expo URL)');
  } catch (e) {
    console.error('❌ Erreur update tables:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updateTables();
