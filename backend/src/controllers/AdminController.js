const pool = require('../database/pool');
const StatsModel = require('../models/StatsModel');

class AdminController {

  /**
   * GET /api/admin/dashboard
   * Résumé complet du jour : commandes, revenus, clients, commandes actives, assistance
   */
  async dashboard(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Run all queries in parallel for speed
      const [todayOrders, activeOrders, pendingAssistance, revenueWeek, topProducts, recentOrders] = await Promise.all([
        // Today's order summary
        pool.query(`
          SELECT
            COUNT(*)::int                                                          AS total_orders,
            COALESCE(SUM(total_price), 0)::numeric(10,2)                          AS total_revenue,
            COUNT(*) FILTER (WHERE status = 'completed')::int                     AS completed_orders,
            COUNT(*) FILTER (WHERE status NOT IN ('completed'))::int               AS pending_orders,
            ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)
              FILTER (WHERE completed_at IS NOT NULL), 1)                          AS avg_prep_time_minutes
          FROM orders
          WHERE DATE(created_at) = $1
        `, [today]),

        // Currently active orders count
        pool.query(`
          SELECT COUNT(*)::int AS count FROM orders
          WHERE status IN ('new','brewing','preparing','ready')
        `),

        // Pending assistance requests
        pool.query(`
          SELECT COUNT(*)::int AS count FROM assistance_requests WHERE status = 'pending'
        `),

        // Revenue last 7 days
        pool.query(`
          SELECT
            DATE(created_at)                    AS date,
            COUNT(*)::int                        AS orders,
            COALESCE(SUM(total_price),0)::numeric(10,2) AS revenue
          FROM orders
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          ORDER BY date
        `),

        // Top 5 products today
        pool.query(`
          SELECT
            p.name,
            p.id,
            SUM(oi.quantity)::int          AS qty_sold,
            SUM(oi.subtotal)::numeric(10,2) AS revenue
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          JOIN orders o   ON o.id = oi.order_id
          WHERE DATE(o.created_at) = $1
          GROUP BY p.id, p.name
          ORDER BY qty_sold DESC
          LIMIT 5
        `, [today]),

        // Last 10 orders (recent activity feed)
        pool.query(`
          SELECT
            o.id, o.status, o.total_price, o.created_at,
            t.table_number
          FROM orders o
          LEFT JOIN tables t ON t.id = o.table_id
          ORDER BY o.created_at DESC
          LIMIT 10
        `),
      ]);

      res.json({
        success: true,
        data: {
          today: {
            ...todayOrders.rows[0],
            date: today,
          },
          live: {
            active_orders:       activeOrders.rows[0].count,
            pending_assistance:  pendingAssistance.rows[0].count,
          },
          revenue_last_7_days: revenueWeek.rows,
          top_products_today:  topProducts.rows,
          recent_orders:       recentOrders.rows,
        },
      });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/peak-hours?date=2024-03-13
   * Analyse des heures de pointe (commandes & revenus par heure)
   */
  async peakHours(req, res, next) {
    try {
      const date = req.query.date || new Date().toISOString().split('T')[0];
      const data = await StatsModel.getPeakHoursAnalysis(date);
      res.json({ success: true, data, date });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/product-sales?productId=1&startDate=2024-03-01&endDate=2024-03-13
   * Ventes d'un produit sur une période
   */
  async productSales(req, res, next) {
    try {
      const { productId, startDate, endDate } = req.query;
      if (!productId || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'productId, startDate et endDate sont requis' });
      }
      const data = await StatsModel.getProductSalesRange(productId, startDate, endDate);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/daily-stats?startDate=2024-03-01&endDate=2024-03-13
   * Stats journalières sur une période (pour graphiques de tendance)
   */
  async dailyStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'startDate et endDate sont requis' });
      }
      const data = await StatsModel.getDailyStatsRange(startDate, endDate);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/orders/active
   * Toutes les commandes actives en temps réel (vue cuisine)
   */
  async activeOrders(req, res, next) {
    try {
      const result = await pool.query(`
        SELECT
          o.*,
          t.table_number,
          COUNT(oi.id)::int     AS item_count,
          EXTRACT(EPOCH FROM (NOW() - o.created_at) / 60)::int AS minutes_waiting
        FROM orders o
        LEFT JOIN tables     t  ON t.id  = o.table_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status IN ('new','brewing','preparing','ready')
        GROUP BY o.id, t.table_number
        ORDER BY
          CASE o.status
            WHEN 'new'       THEN 1
            WHEN 'brewing'   THEN 2
            WHEN 'preparing' THEN 3
            WHEN 'ready'     THEN 4
          END,
          o.created_at ASC
      `);
      res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/tables
   * Vue complète des tables : statut, commandes actives, QR code
   */
  async tables(req, res, next) {
    try {
      const result = await pool.query(`
        SELECT
          t.*,
          COUNT(o.id) FILTER (WHERE o.status NOT IN ('completed'))::int AS active_orders,
          MAX(o.created_at) AS last_order_at
        FROM tables t
        LEFT JOIN orders o ON o.table_id = t.id
        GROUP BY t.id
        ORDER BY t.table_number
      `);
      res.json({ success: true, data: result.rows });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/revenue/summary?period=week|month|today
   * Résumé des revenus par période
   */
  async revenueSummary(req, res, next) {
    try {
      const period = req.query.period || 'week';
      let interval;
      if (period === 'today')  interval = '1 day';
      else if (period === 'week')  interval = '7 days';
      else if (period === 'month') interval = '30 days';
      else return res.status(400).json({ success: false, error: 'period doit être today, week ou month' });

      const result = await pool.query(`
        SELECT
          COUNT(*)::int                             AS total_orders,
          COALESCE(SUM(total_price),0)::numeric(10,2) AS total_revenue,
          COALESCE(AVG(total_price),0)::numeric(10,2)  AS avg_order_value,
          COUNT(*) FILTER (WHERE status='completed')::int AS completed,
          COUNT(DISTINCT table_id)::int              AS tables_served
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${interval}'
      `);
      res.json({ success: true, data: { period, ...result.rows[0] } });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
