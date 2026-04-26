const pool = require('../database/pool');
const StatsModel = require('../models/StatsModel');
const TableService = require('../services/TableService');

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
   * GET /api/admin/analytics?period=7|30
   * Provides comprehensive analytics data for the dashboard.
   */
  async getAnalytics(req, res, next) {
    try {
      const periodParam = req.query.period || '7';
      const days = periodParam === '30' ? 30 : 7;
      const interval = `${days} days`;

      // Run all queries in parallel
      const [statsRes, prevStatsRes, revenueRes, categoryRes, peakHoursRes] = await Promise.all([
        // 1. Current Period Stats
        pool.query(`
          SELECT 
            COALESCE(SUM(o.total_price), 0)::numeric(10,2) AS gross_revenue,
            COUNT(o.id)::int AS total_orders,
            COALESCE(AVG(o.total_price), 0)::numeric(10,2) AS average_order,
            ROUND(AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at)) / 60) FILTER (WHERE o.completed_at IS NOT NULL), 1) AS prep_efficiency,
            (SELECT COUNT(*)::int FROM loyalty_accounts WHERE created_at >= NOW() - INTERVAL $1) AS new_customers
          FROM orders o
          WHERE o.status = 'completed' AND o.created_at >= NOW() - INTERVAL $1
        `, [interval]),

        // 2. Previous Period Stats (for percentage change calculation)
        pool.query(`
          SELECT 
            COALESCE(SUM(o.total_price), 0)::numeric(10,2) AS prev_gross_revenue,
            COUNT(o.id)::int AS prev_total_orders,
            COALESCE(AVG(o.total_price), 0)::numeric(10,2) AS prev_average_order,
            ROUND(AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at)) / 60) FILTER (WHERE o.completed_at IS NOT NULL), 1) AS prev_prep_efficiency,
            (SELECT COUNT(*)::int FROM loyalty_accounts WHERE created_at >= NOW() - INTERVAL $1 AND created_at < NOW() - INTERVAL $2) AS prev_new_customers
          FROM orders o
          WHERE o.status = 'completed' 
            AND o.created_at >= NOW() - INTERVAL $1
            AND o.created_at < NOW() - INTERVAL $2
        `, [`${days * 2} days`, interval]),

        // 3. Daily Revenue Chart
        pool.query(`
          SELECT
            TRIM(to_char(DATE(created_at), 'Dy')) AS name,
            DATE(created_at) AS full_date,
            COALESCE(SUM(total_price), 0)::numeric(10,2) AS revenue,
            COUNT(id)::int AS orders
          FROM orders
          WHERE status = 'completed' AND created_at >= NOW() - INTERVAL $1
          GROUP BY DATE(created_at)
          ORDER BY full_date ASC
        `, [interval]),

        // 4. Sales by Category Pie Chart
        pool.query(`
          SELECT 
            c.name,
            COALESCE(SUM(oi.subtotal), 0)::numeric(10,2) AS value
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          JOIN categories c ON c.id = p.category_id
          JOIN orders o ON o.id = oi.order_id
          WHERE o.status = 'completed' AND o.created_at >= NOW() - INTERVAL $1
          GROUP BY c.name
          ORDER BY value DESC
        `, [interval]),

        // 5. Peak Hours Heatmap
        pool.query(`
          SELECT 
            EXTRACT(HOUR FROM created_at)::int AS hour,
            COUNT(id)::int AS count
          FROM orders
          WHERE created_at >= NOW() - INTERVAL $1
          GROUP BY hour
          ORDER BY hour ASC
        `, [interval])
      ]);

      const currentStats = statsRes.rows[0] || {};
      const prevStats = prevStatsRes.rows[0] || {};

      // Calculate percentage changes
      const calcChange = (current, previous) => {
        if (!previous || parseFloat(previous) === 0) return current > 0 ? '+100%' : '0%';
        const diff = parseFloat(current) - parseFloat(previous);
        const change = (diff / parseFloat(previous)) * 100;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      };

      const prepEfficiencyCurrent = parseFloat(currentStats.prep_efficiency || 0);
      const prepEfficiencyPrev = parseFloat(prevStats.prev_prep_efficiency || 0);
      let prepChange = '0%';
      if (prepEfficiencyPrev > 0) {
          const diff = prepEfficiencyCurrent - prepEfficiencyPrev;
          const change = (diff / prepEfficiencyPrev) * 100;
          prepChange = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      }

      const stats = {
        gross_revenue: {
          value: parseFloat(currentStats.gross_revenue || 0),
          change: calcChange(currentStats.gross_revenue, prevStats.prev_gross_revenue)
        },
        new_customers: {
          value: parseInt(currentStats.new_customers || 0),
          change: calcChange(currentStats.new_customers, prevStats.prev_new_customers)
        },
        average_order: {
          value: parseFloat(currentStats.average_order || 0),
          change: calcChange(currentStats.average_order, prevStats.prev_average_order)
        },
        prep_efficiency: {
          value: prepEfficiencyCurrent,
          change: prepChange
        }
      };

      // Format peak hours into an array of 24
      const peak_hours = Array(24).fill(0);
      peakHoursRes.rows.forEach(row => {
        if (row.hour >= 0 && row.hour < 24) {
          peak_hours[row.hour] = row.count;
        }
      });

      res.json({
        success: true,
        data: {
          period: days,
          stats,
          revenue_chart: revenueRes.rows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })),
          category_chart: categoryRes.rows.map(r => ({ ...r, value: parseFloat(r.value) })),
          peak_hours
        }
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
          (
            SELECT json_agg(json_build_object(
              'name', p.name,
              'quantity', oi.quantity,
              'price', oi.unit_price
            ))
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = o.id
          ) AS items,
          EXTRACT(EPOCH FROM (NOW() - o.created_at) / 60)::int AS minutes_waiting
        FROM orders o
        LEFT JOIN tables t ON t.id = o.table_id
        WHERE o.status IN ('new','brewing','preparing','ready')
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

  /**
   * POST /api/admin/tables/:tableId/sessions/close-all
   * Invalide toutes les sessions encore ouvertes pour cette table (staff).
   */
  async closeTableSessions(req, res, next) {
    try {
      const tableId = parseInt(req.params.tableId, 10);
      if (!Number.isInteger(tableId)) {
        return res.status(400).json({ success: false, error: 'tableId invalide' });
      }
      const SessionModel = require('../models/SessionModel');
      const closedCount = await SessionModel.closeAllOpenForTable(tableId);
      res.json({
        success: true,
        data: { closed_count: closedCount },
        message:
          closedCount > 0
            ? `${closedCount} session(s) fermée(s) pour cette table.`
            : 'Aucune session ouverte à fermer.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users
   * Liste tous les utilisateurs (pour gestion staff)
   */
  async listUsers(req, res, next) {
    try {
      const result = await pool.query('SELECT id, full_name, email, role, created_at FROM users ORDER BY role, full_name');
      res.json({ success: true, data: result.rows });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/tables
   * Créer une nouvelle table
   */
  async createTable(req, res, next) {
    try {
      const table = await TableService.createTable(req.body);
      res.status(201).json({ success: true, data: table });
    } catch (err) { next(err); }
  }

  /**
   * PUT /api/admin/tables/:id
   * Modifier une table
   */
  async updateTable(req, res, next) {
    try {
      const table = await TableService.updateTable(parseInt(req.params.id), req.body);
      res.json({ success: true, data: table });
    } catch (err) { next(err); }
  }

  /**
   * DELETE /api/admin/tables/:id
   * Désactiver une table (soft delete)
   */
  async deleteTable(req, res, next) {
    try {
      const table = await TableService.deactivateTable(parseInt(req.params.id));
      res.json({ success: true, data: table, message: 'Table désactivée.' });
    } catch (err) { next(err); }
  }
}

module.exports = new AdminController();
