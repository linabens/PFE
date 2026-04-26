const pool = require('../database/pool');

class PromotionModel {
  /**
   * Get all active promotions ordered by display_order
   */
  async findAll(options = {}) {
    const { isActive = true, limit = 10, offset = 0 } = options;
    
    let query = 'SELECT * FROM promotions';
    const values = [];
    
    if (isActive !== null) {
      query += ' WHERE is_active = $1';
      values.push(isActive);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    if (limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(limit);
    }
    
    if (offset) {
      query += ` OFFSET $${values.length + 1}`;
      values.push(offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Create a new promotion
   */
  async create(data) {
    const { title, subtitle, tag, image_url, display_order = 0 } = data;
    const query = `
      INSERT INTO promotions (title, subtitle, tag, image_url, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [title, subtitle, tag, image_url, display_order]);
    return result.rows[0];
  }

  /**
   * Delete a promotion
   */
  async delete(id) {
    const result = await pool.query('DELETE FROM promotions WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  /**
   * Update promotion status
   */
  async updateStatus(id, isActive) {
    const result = await pool.query(
      'UPDATE promotions SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    return result.rows[0];
  }
}

module.exports = new PromotionModel();
