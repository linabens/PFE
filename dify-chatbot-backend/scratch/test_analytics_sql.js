const pool = require('../backend/src/database/pool');

async function testQueries() {
  try {
    const days = 7;
    const interval = `${days} days`;
    
    console.log(`Running analytics query for ${interval}...`);
    
    const [statsRes] = await Promise.all([
      pool.query(`
        SELECT 
          COALESCE(SUM(o.total_price), 0)::numeric(10,2) AS gross_revenue,
          COUNT(o.id)::int AS total_orders,
          COALESCE(AVG(o.total_price), 0)::numeric(10,2) AS average_order,
          ROUND(AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at)) / 60) FILTER (WHERE o.completed_at IS NOT NULL), 1) AS prep_efficiency,
          (SELECT COUNT(*)::int FROM loyalty_accounts WHERE created_at >= NOW() - INTERVAL $1) AS new_customers
        FROM orders o
        WHERE o.status = 'completed' AND o.created_at >= NOW() - INTERVAL $1
      `, [interval])
    ]);
    
    console.log('Stats Result:', statsRes.rows[0]);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

testQueries();
