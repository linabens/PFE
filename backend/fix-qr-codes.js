const pool = require('./src/database/pool');

async function fixQrCodes() {
  try {
    // Update all tables to have clean TABLE_N qr_codes
    await pool.query("UPDATE tables SET qr_code = 'TABLE_1' WHERE table_number = 1");
    await pool.query("UPDATE tables SET qr_code = 'TABLE_2' WHERE table_number = 2");
    await pool.query("UPDATE tables SET qr_code = 'TABLE_3' WHERE table_number = 3");
    await pool.query("UPDATE tables SET qr_code = 'TABLE_4' WHERE table_number = 4");
    await pool.query("UPDATE tables SET qr_code = 'TABLE_5' WHERE table_number = 5");

    const result = await pool.query(
      'SELECT id, table_number, qr_code, is_active FROM tables ORDER BY table_number'
    );
    console.log('QR codes updated successfully:');
    console.table(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixQrCodes();
