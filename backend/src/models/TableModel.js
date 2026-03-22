const pool = require('../database/pool');

class TableModel {
  /**
   * Récupérer toutes les tables (actives et inactives)
   */
  async findAll() {
    const result = await pool.query(`
      SELECT t.*,
        COUNT(o.id) FILTER (WHERE o.status NOT IN ('completed'))::int AS active_orders,
        MAX(s.created_at) AS last_session_at
      FROM tables t
      LEFT JOIN orders o ON o.table_id = t.id
      LEFT JOIN sessions s ON s.table_id = t.id
      GROUP BY t.id
      ORDER BY t.table_number
    `);
    return result.rows;
  }

  /**
   * Récupérer toutes les tables actives
   */
  async findAllActive() {
    const result = await pool.query(`
      SELECT * FROM tables
      WHERE is_active = true
      ORDER BY table_number
    `);
    return result.rows;
  }

  /**
   * Récupérer une table par ID
   */
  async findById(tableId) {
    const result = await pool.query('SELECT * FROM tables WHERE id = $1', [tableId]);
    return result.rows[0] || null;
  }

  /**
   * Récupérer une table par numéro
   */
  async findByNumber(tableNumber) {
    const result = await pool.query('SELECT * FROM tables WHERE table_number = $1', [tableNumber]);
    return result.rows[0] || null;
  }

  /**
   * Récupérer une table par QR code
   */
  async findByQrCode(qrCode) {
    const result = await pool.query('SELECT * FROM tables WHERE qr_code = $1', [qrCode]);
    return result.rows[0] || null;
  }

  /**
   * Créer une nouvelle table
   */
  async create({ table_number, capacity = 4, qr_code }) {
    const result = await pool.query(
      `INSERT INTO tables (table_number, capacity, qr_code, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [table_number, capacity, qr_code]
    );
    return result.rows[0];
  }

  /**
   * Mettre à jour une table
   */
  async update(tableId, data) {
    const fields = [];
    const values = [];
    let i = 1;

    if (data.table_number !== undefined) { fields.push(`table_number = $${i++}`); values.push(data.table_number); }
    if (data.capacity !== undefined)     { fields.push(`capacity = $${i++}`);     values.push(data.capacity); }
    if (data.qr_code !== undefined)      { fields.push(`qr_code = $${i++}`);      values.push(data.qr_code); }
    if (data.is_active !== undefined)    { fields.push(`is_active = $${i++}`);    values.push(data.is_active); }

    if (fields.length === 0) return this.findById(tableId);

    values.push(tableId);
    const result = await pool.query(
      `UPDATE tables SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Supprimer une table (soft delete)
   */
  async deactivate(tableId) {
    const result = await pool.query(
      'UPDATE tables SET is_active = false WHERE id = $1 RETURNING *',
      [tableId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new TableModel();
