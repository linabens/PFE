const pool = require('../database/pool');

/**
 * Base Model class providing common database operations
 * All models extend this class for consistent data access patterns
 */
class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findAll(options = {}) {
    const {
      where = {},
      orderBy = 'created_at DESC',
      limit = 50,
      offset = 0,
      columns = '*',
    } = options;

    const { whereClause, values } = this.buildWhereClause(where);
    
    const query = `
      SELECT ${columns}
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;
    
    const result = await this.pool.query(query, [...values, limit, offset]);
    return result.rows;
  }

  /**
   * Find a single record by ID
   */
  async findById(id) {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find a single record by custom condition
   */
  async findOne(where) {
    const { whereClause, values } = this.buildWhereClause(where);
    const query = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`;
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Count records with optional filtering
   */
  async count(where = {}) {
    const { whereClause, values } = this.buildWhereClause(where);
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Create a new record
   */
  async create(data, client = null) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const executor = client || this.pool;
    const result = await executor.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a record by ID
   */
  async update(id, data, client = null) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    
    const executor = client || this.pool;
    const result = await executor.query(query, [...values, id]);
    return result.rows[0] || null;
  }

  /**
   * Delete a record by ID
   */
  async delete(id, client = null) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const executor = client || this.pool;
    const result = await executor.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Soft delete (set is_active to false)
   */
  async softDelete(id, client = null) {
    return this.update(id, { is_active: false }, client);
  }

  /**
   * Execute raw query
   */
  async query(sql, params = [], client = null) {
    const executor = client || this.pool;
    const result = await executor.query(sql, params);
    return result.rows;
  }

  /**
   * Execute query within a transaction
   */
  async transaction(callback) {
    return this.pool.transaction(callback);
  }

  /**
   * Build WHERE clause from object
   */
  buildWhereClause(where) {
    const keys = Object.keys(where);
    if (keys.length === 0) {
      return { whereClause: '', values: [] };
    }

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    for (const key of keys) {
      const value = where[key];
      
      if (value === null) {
        conditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        values.push(...value);
        paramIndex += value.length;
      } else if (typeof value === 'object' && value.operator) {
        // Support for operators: { operator: '>=', value: 10 }
        conditions.push(`${key} ${value.operator} $${paramIndex}`);
        values.push(value.value);
        paramIndex++;
      } else {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      values,
    };
  }
}

module.exports = BaseModel;

