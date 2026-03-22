const pool = require('../database/pool');
const crypto = require('crypto');

class SessionModel {
  /**
   * Create a new anonymous session (optional table_id from QR code)
   */
  async create(tableId = null) {
    const token = crypto.randomBytes(24).toString('hex');
    const query = `
      INSERT INTO sessions (table_id, token)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [tableId, token]);
    return result.rows[0];
  }

  /**
   * Find a session by its token
   */
  async findByToken(token) {
    const query = `SELECT * FROM sessions WHERE token = $1`;
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Link session to loyalty account (customer enters name and optional phone to collect points)
   */
  async linkToLoyalty(token, customer_name, phone_number, customer_id_number, loyalty_account_id) {
    const query = `
      UPDATE sessions
      SET customer_name = $2, 
          phone_number = $3,
          customer_id_number = $4,
          loyalty_account_id = $5,
          last_active_at = NOW()
      WHERE token = $1
      RETURNING *
    `;
    const result = await pool.query(query, [token, customer_name, phone_number || null, customer_id_number || null, loyalty_account_id]);
    return result.rows[0];
  }

  /**
   * Mark session as active (update last_active_at)
   */
  async touch(token) {
    const query = `
      UPDATE sessions
      SET last_active_at = CURRENT_TIMESTAMP
      WHERE token = $1
      RETURNING *
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }
}

module.exports = new SessionModel();
