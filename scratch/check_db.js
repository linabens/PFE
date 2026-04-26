require('dotenv').config({ path: './backend/.env' });
const pool = require('./backend/src/database/pool');

async function checkDatabase() {
  try {
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in database:', tables.rows.map(r => r.table_name));

    // Check for products
    const products = await pool.query('SELECT count(*) FROM products');
    console.log('Product count:', products.rows[0].count);

    // Check for categories
    const categories = await pool.query('SELECT count(*) FROM categories');
    console.log('Category count:', categories.rows[0].count);

    // Check for promotions
    try {
      const promotions = await pool.query('SELECT count(*) FROM promotions');
      console.log('Promotion count:', promotions.rows[0].count);
    } catch (e) {
      console.log('Promotions table error:', e.message);
    }

    // Check for assistance requests
    try {
      const assistance = await pool.query('SELECT count(*) FROM assistance_requests');
      console.log('Assistance request count:', assistance.rows[0].count);
    } catch (e) {
      console.log('Assistance requests table error:', e.message);
    }

    // Check for orders
    try {
      const orders = await pool.query('SELECT count(*) FROM orders');
      console.log('Order count:', orders.rows[0].count);
      
      const activeOrders = await pool.query("SELECT count(*) FROM orders WHERE status IN ('new','brewing','preparing','ready')");
      console.log('Active Order count:', activeOrders.rows[0].count);
    } catch (e) {
      console.log('Orders table error:', e.message);
    }

  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    await pool.end();
  }
}

checkDatabase();
