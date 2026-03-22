const pool = require('../database/pool');

class LoyaltyModel {
  /**
   * Find or create a loyalty account by customer name (required) and optional phone/ID
   */
  static async findOrCreate({ customer_name, phone_number = null, customer_id_number = null }) {
    if (!customer_name || customer_name.trim().length === 0) {
      throw new Error('Customer name is required for loyalty enrollment');
    }

    const client = await pool.connect();
    try {
      // Try to find existing by name (phone and ID are optional identifiers)
      const existing = await client.query(
        `SELECT * FROM loyalty_accounts 
         WHERE customer_name = $1
         LIMIT 1`,
        [customer_name.trim()]
      );
      
      if (existing.rows.length > 0) {
        return existing.rows[0];
      }
      
      // Create new loyalty account
      const result = await client.query(
        `INSERT INTO loyalty_accounts (customer_name, phone_number, customer_id_number, points, total_earned)
         VALUES ($1, $2, $3, 0, 0)
         RETURNING *`,
        [customer_name.trim(), phone_number || null, customer_id_number || null]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  /**
   * Find loyalty account by customer name (required)
   * Phone and ID are optional filters
   */
  static async findByName(customer_name, phone_number = null, customer_id_number = null) {
    if (!customer_name || customer_name.trim().length === 0) {
      return null;
    }

    const client = await pool.connect();
    try {
      let query = `SELECT * FROM loyalty_accounts WHERE LOWER(customer_name) = LOWER($1)`;
      const params = [customer_name.trim()];
      
      if (phone_number) {
        query += ` AND phone_number = $${params.length + 1}`;
        params.push(phone_number);
      }
      
      if (customer_id_number) {
        query += ` AND customer_id_number = $${params.length + 1}`;
        params.push(customer_id_number);
      }
      
      const result = await client.query(query, params);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
  
  /**
   * Add points to loyalty account
   */
  static async addPoints(loyaltyId, points) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE loyalty_accounts 
         SET points = points + $1, 
             total_earned = total_earned + $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [points, loyaltyId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  /**
   * Use loyalty points
   */
  static async usePoints(loyaltyId, points) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE loyalty_accounts 
         SET points = GREATEST(0, points - $1),
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [points, loyaltyId]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  /**
   * Create loyalty transaction record
   */
  static async createTransaction(loyaltyId, orderId, points_added = 0, points_used = 0) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO loyalty_transactions (loyalty_id, order_id, points_added, points_used)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [loyaltyId, orderId, points_added, points_used]
      );
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

module.exports = LoyaltyModel;
