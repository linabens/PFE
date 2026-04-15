const pool = require('../database/pool');
const crypto = require('crypto');
const config = require('../config');

class SessionModel {
  /**
   * Create a new anonymous session (optional table_id from QR code)
   */
  async create(tableId = null) {
    const token = crypto.randomBytes(24).toString('hex');
    const maxAgeMin = config.sessionMaxAgeMinutes || 120;
    const query = `
      INSERT INTO sessions (table_id, token, expires_at, last_active_at, is_closed)
      VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 minute'), NOW(), false)
      RETURNING *
    `;
    const result = await pool.query(query, [tableId, token, maxAgeMin]);
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
   * Contrôle métier : session utilisable pour commander / jouer ?
   */
  validateSessionRow(session) {
    if (!session) {
      return { ok: false, code: 'NOT_FOUND' };
    }
    if (session.is_closed === true) {
      return { ok: false, code: 'CLOSED' };
    }
    if (session.expires_at) {
      const exp = new Date(session.expires_at).getTime();
      if (Date.now() > exp) {
        return { ok: false, code: 'EXPIRED' };
      }
    }
    const idleMs = (config.sessionIdleTimeoutMinutes || 45) * 60 * 1000;
    if (session.last_active_at) {
      const last = new Date(session.last_active_at).getTime();
      if (Date.now() - last > idleMs) {
        return { ok: false, code: 'IDLE' };
      }
    }
    return { ok: true };
  }

  /**
   * Fermeture volontaire (client quitte le café)
   */
  async closeByToken(token) {
    const result = await pool.query(
      `UPDATE sessions
       SET is_closed = true, closed_at = NOW()
       WHERE token = $1 AND is_closed = false
       RETURNING *`,
      [token]
    );
    return result.rows[0] || null;
  }

  /**
   * Staff : invalider toutes les sessions encore ouvertes pour une table
   */
  async closeAllOpenForTable(tableId) {
    const result = await pool.query(
      `UPDATE sessions
       SET is_closed = true, closed_at = NOW()
       WHERE table_id = $1 AND is_closed = false`,
      [tableId]
    );
    return result.rowCount || 0;
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
        AND COALESCE(is_closed, false) = false
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }
}

module.exports = new SessionModel();
