const BaseModel = require('./BaseModel');

class StatsModel extends BaseModel {
  constructor() {
    super('daily_stats');
  }

  /**
   * Update daily product stats (for popularity meter)
   */
  async updateProductStats(productId, quantitySold, revenue, date = null, client = null) {
    const executor = client || this.pool;
    const statsDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      INSERT INTO daily_product_stats (product_id, date, quantity_sold, revenue)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, date)
      DO UPDATE SET 
        quantity_sold = daily_product_stats.quantity_sold + EXCLUDED.quantity_sold,
        revenue = daily_product_stats.revenue + EXCLUDED.revenue
      RETURNING *
    `;
    
    const result = await executor.query(query, [productId, statsDate, quantitySold, revenue]);
    return result.rows[0];
  }

  /**
   * Update daily shop stats
   */
  async updateDailyStats(stats, date = null, client = null) {
    const executor = client || this.pool;
    const statsDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      INSERT INTO daily_stats (date, total_orders, total_revenue, total_customers)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (date)
      DO UPDATE SET 
        total_orders = daily_stats.total_orders + EXCLUDED.total_orders,
        total_revenue = daily_stats.total_revenue + EXCLUDED.total_revenue,
        total_customers = daily_stats.total_customers + EXCLUDED.total_customers,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await executor.query(query, [
      statsDate,
      stats.orders || 1,
      stats.revenue || 0,
      stats.customers || 1,
    ]);
    
    return result.rows[0];
  }

  /**
   * Get trending products (most sold today)
   */
  async getTrendingProducts(limit = 10, date = null) {
    const statsDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        dps.quantity_sold as today_sales,
        dps.revenue as today_revenue
      FROM daily_product_stats dps
      JOIN products p ON p.id = dps.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE dps.date = $1 AND p.is_active = true
      ORDER BY dps.quantity_sold DESC
      LIMIT $2
    `;
    
    const result = await this.pool.query(query, [statsDate, limit]);
    return result.rows;
  }

  /**
   * Get product sales for date range
   */
  async getProductSalesRange(productId, startDate, endDate) {
    const query = `
      SELECT 
        date,
        quantity_sold,
        revenue
      FROM daily_product_stats
      WHERE product_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date
    `;
    
    const result = await this.pool.query(query, [productId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get daily stats for date range
   */
  async getDailyStatsRange(startDate, endDate) {
    const query = `
      SELECT *
      FROM daily_stats
      WHERE date >= $1 AND date <= $2
      ORDER BY date
    `;
    
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  /**
   * Calculate and update average preparation time
   */
  async updatePrepTimeStats(date = null, client = null) {
    const executor = client || this.pool;
    const statsDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      WITH prep_times AS (
        SELECT 
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) as avg_minutes
        FROM orders
        WHERE DATE(created_at) = $1 AND status = 'completed' AND completed_at IS NOT NULL
      )
      UPDATE daily_stats
      SET avg_preparation_time_minutes = (SELECT avg_minutes FROM prep_times)
      WHERE date = $1
      RETURNING *
    `;
    
    const result = await executor.query(query, [statsDate]);
    return result.rows[0];
  }

  /**
   * Calculate and update loyalty usage rate
   */
  async updateLoyaltyStats(date = null, client = null) {
    const executor = client || this.pool;
    const statsDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      WITH loyalty_usage AS (
        SELECT 
          COUNT(*) FILTER (WHERE loyalty_points_used > 0)::decimal / NULLIF(COUNT(*), 0) as usage_rate
        FROM orders
        WHERE DATE(created_at) = $1
      )
      UPDATE daily_stats
      SET loyalty_usage_rate = COALESCE((SELECT usage_rate FROM loyalty_usage), 0)
      WHERE date = $1
      RETURNING *
    `;
    
    const result = await executor.query(query, [statsDate]);
    return result.rows[0];
  }

  /**
   * Get admin dashboard summary
   */
  async getDashboardSummary() {
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      WITH today_stats AS (
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_price), 0) as total_revenue,
          COUNT(DISTINCT user_id) as unique_customers,
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) FILTER (WHERE completed_at IS NOT NULL) as avg_prep_time
        FROM orders
        WHERE DATE(created_at) = $1
      ),
      pending_assistance AS (
        SELECT COUNT(*) as count
        FROM assistance_requests
        WHERE status = 'pending'
      ),
      active_orders AS (
        SELECT COUNT(*) as count
        FROM orders
        WHERE status NOT IN ('completed')
      ),
      top_products AS (
        SELECT 
          p.name,
          dps.quantity_sold
        FROM daily_product_stats dps
        JOIN products p ON p.id = dps.product_id
        WHERE dps.date = $1
        ORDER BY dps.quantity_sold DESC
        LIMIT 5
      )
      SELECT 
        ts.*,
        pa.count as pending_assistance,
        ao.count as active_orders,
        (SELECT json_agg(tp.*) FROM top_products tp) as top_products
      FROM today_stats ts, pending_assistance pa, active_orders ao
    `;
    
    const result = await this.pool.query(query, [today]);
    return result.rows[0];
  }

  /**
   * Get peak hours analysis
   */
  async getPeakHoursAnalysis(date = null) {
    const analysisDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count,
        SUM(total_price) as revenue
      FROM orders
      WHERE DATE(created_at) = $1
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `;
    
    const result = await this.pool.query(query, [analysisDate]);
    return result.rows;
  }
}

module.exports = new StatsModel();

