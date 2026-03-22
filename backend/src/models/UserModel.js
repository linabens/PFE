const pool = require('../database/pool');

class UserModel {
  async findById(userId) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async create(userData) {
    const { full_name, email, password_hash, role } = userData;
    const query = `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [full_name, email, password_hash, role]);
    return result.rows[0];
  }

  async update(userId, data) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key in data) {
      fields.push(`${key} = $${idx}`);
      values.push(data[key]);
      idx++;
    }
    if (fields.length === 0) return this.findById(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    values.push(userId);
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new UserModel();
