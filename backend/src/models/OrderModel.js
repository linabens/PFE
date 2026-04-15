const pool = require('../database/pool');

class OrderModel {
  /**
   * Créer une commande avec ses items et options
   */
  async createOrder(orderData, items, client = null) {
    const executor = client || pool;
    
    // Créer la commande
    // include session_id if provided (customers are anonymous)
    const orderQuery = `
      INSERT INTO orders (table_id, session_id, user_id, status, total_price, loyalty_used)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const orderResult = await executor.query(orderQuery, [
      orderData.table_id,
      orderData.session_id || null,
      orderData.user_id || null, // Peut être NULL pour les clients sans compte
      orderData.status || 'new',
      orderData.total_price,
      orderData.loyalty_used || false,
    ]);
    
    const order = orderResult.rows[0];
    
    // Créer les items de la commande
    for (const item of items) {
      const orderItemQuery = `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const orderItem = await executor.query(orderItemQuery, [
        order.id,
        item.product_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);
      
      // Créer les options de l'item
      if (item.options && item.options.length > 0) {
        for (const option of item.options) {
          await executor.query(
            `INSERT INTO order_item_options (order_item_id, option_name, price_modifier)
             VALUES ($1, $2, $3)`,
            [orderItem.rows[0].id, option.option_name, option.price_modifier]
          );
        }
      }
    }
    
    // Créer l'historique du statut initial
    await executor.query(
      `INSERT INTO order_status_history (order_id, status)
       VALUES ($1, 'new')`,
      [order.id]
    );
    
    return this.findById(order.id, executor);
  }

  /**
   * Récupérer une commande par ID avec tous les détails
   */
  async findById(orderId, client = null) {
    const executor = client || pool;
    
    const orderQuery = `
      SELECT 
        o.*,
        t.table_number
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      WHERE o.id = $1
    `;
    
    const itemsQuery = `
      SELECT 
        oi.*,
        p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id
    `;
    
    const [orderResult, itemsResult] = await Promise.all([
      executor.query(orderQuery, [orderId]),
      executor.query(itemsQuery, [orderId]),
    ]);
    
    if (!orderResult.rows[0]) return null;
    
    const order = orderResult.rows[0];
    
    // Récupérer les options pour chaque item
    const items = await Promise.all(
      itemsResult.rows.map(async (item) => {
        const optionsResult = await executor.query(
          'SELECT * FROM order_item_options WHERE order_item_id = $1',
          [item.id]
        );
        return {
          ...item,
          options: optionsResult.rows,
        };
      })
    );
    
    return {
      ...order,
      items,
    };
  }

  /**
   * Récupérer les commandes d'une table
   */
  async findByTable(tableId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let whereConditions = [];
    let values = [];
    let paramIndex = 1;
    
    if (tableId) {
      whereConditions.push(`o.table_id = $${paramIndex}`);
      values.push(tableId);
      paramIndex++;
    }
    if (options.sessionId) {
      whereConditions.push(`o.session_id = $${paramIndex}`);
      values.push(options.sessionId);
      paramIndex++;
    }
    
    if (status) {
      whereConditions.push(`o.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    const query = `
      SELECT 
        o.*,
        t.table_number,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${whereClause}
      GROUP BY o.id, t.table_number
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    values.push(limit, offset);
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Récupérer toutes les commandes actives (non complétées)
   */
  async findActive() {
    const query = `
      SELECT 
        o.*,
        t.table_number,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN tables t ON t.id = o.table_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status IN ('new', 'brewing', 'preparing', 'ready')
      GROUP BY o.id, t.table_number
      ORDER BY 
        CASE o.status
          WHEN 'new' THEN 1
          WHEN 'brewing' THEN 2
          WHEN 'preparing' THEN 3
          WHEN 'ready' THEN 4
        END,
        o.created_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatus(orderId, newStatus, changedBy = null, client = null) {
    const executor = client || pool;
    
    const updateData = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completed_at = new Date();
    }
    
    const updateQuery = `
      UPDATE orders
      SET status = $1, completed_at = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const order = await executor.query(updateQuery, [
      newStatus,
      newStatus === 'completed' ? new Date() : null,
      orderId,
    ]);
    
    // Ajouter à l'historique
    await executor.query(
      `INSERT INTO order_status_history (order_id, status, changed_by)
       VALUES ($1, $2, $3)`,
      [orderId, newStatus, changedBy]
    );
    
    return order.rows[0];
  }
}

module.exports = new OrderModel();
