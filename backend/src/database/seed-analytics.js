const pool = require('./pool');

async function seedAnalytics() {
  console.log('🌱 Seeding realistic analytics data...');

  try {
    // 1. Get some valid product and category IDs
    const productsRes = await pool.query('SELECT id, price FROM products LIMIT 20');
    if (productsRes.rows.length === 0) {
      console.log('❌ No products found. Please seed products first.');
      return;
    }
    const products = productsRes.rows;

    const tablesRes = await pool.query('SELECT id FROM tables LIMIT 10');
    const tables = tablesRes.rows;

    const usersRes = await pool.query('SELECT id FROM users LIMIT 5');
    const users = usersRes.rows;

    // 2. Clear old orders if needed (optional, but better for fresh analytics)
    // await pool.query('DELETE FROM order_items');
    // await pool.query('DELETE FROM orders');

    console.log(`📊 Generating orders for the last 30 days...`);

    const statuses = ['completed', 'completed', 'completed', 'completed', 'ready']; // Bias towards completed
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Number of orders per day (random between 5 and 15)
      const dailyOrders = Math.floor(Math.random() * 10) + 5;

      for (let j = 0; j < dailyOrders; j++) {
        // Random time during the day
        const hour = Math.floor(Math.random() * 14) + 8; // 8 AM to 10 PM
        const minute = Math.floor(Math.random() * 60);
        const createdAt = new Date(date);
        createdAt.setHours(hour, minute);
        
        const completedAt = new Date(createdAt);
        completedAt.setMinutes(createdAt.getMinutes() + Math.floor(Math.random() * 15) + 5);

        const tableId = tables.length > 0 ? tables[Math.floor(Math.random() * tables.length)].id : null;
        const userId = users.length > 0 ? users[Math.floor(Math.random() * users.length)].id : null;
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Create Order
        const orderRes = await pool.query(`
          INSERT INTO orders (table_id, user_id, status, total_price, created_at, completed_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [tableId, userId, status, 0, createdAt, status === 'completed' ? completedAt : null]);

        const orderId = orderRes.rows[0].id;

        // Add 1-4 random products to order
        const numItems = Math.floor(Math.random() * 3) + 1;
        let totalPrice = 0;

        for (let k = 0; k < numItems; k++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          const subtotal = product.price * qty;
          totalPrice += subtotal;

          await pool.query(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
            VALUES ($1, $2, $3, $4, $5)
          `, [orderId, product.id, qty, product.price, subtotal]);
        }

        // Update order total
        await pool.query('UPDATE orders SET total_price = $1 WHERE id = $2', [totalPrice, orderId]);
      }
    }

    console.log('✅ Analytics seeding complete!');
  } catch (err) {
    console.error('❌ Error seeding analytics:', err);
  } finally {
    process.exit();
  }
}

seedAnalytics();
