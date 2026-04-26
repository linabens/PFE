const pool = require('../database/pool');

class AssistanceModel {
  /**
   * Créer une demande d'assistance (Call Waiter)
   */
  async createRequest(tableId, requestType = 'general', notes = null) {
    const query = `
      INSERT INTO assistance_requests (table_id, status, requested_at)
      VALUES ($1, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await pool.query(query, [tableId]);
    const request = result.rows[0];
    
    // Récupérer aussi le numéro de table avec une jointure
    const fullQuery = `
      SELECT 
        ar.*,
        t.table_number
      FROM assistance_requests ar
      JOIN tables t ON t.id = ar.table_id
      WHERE ar.id = $1
    `;
    
    const fullResult = await pool.query(fullQuery, [request.id]);
    return fullResult.rows[0];
  }

  /**
   * Récupérer toutes les demandes en attente
   */
  async findPending() {
    const query = `
      SELECT 
        ar.*,
        t.table_number
      FROM assistance_requests ar
      JOIN tables t ON t.id = ar.table_id
      WHERE ar.status = 'pending'
      ORDER BY ar.requested_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Récupérer une demande par ID
   */
  async findById(requestId) {
    const query = `
      SELECT 
        ar.*,
        t.table_number
      FROM assistance_requests ar
      JOIN tables t ON t.id = ar.table_id
      WHERE ar.id = $1
    `;
    
    const result = await pool.query(query, [requestId]);
    return result.rows[0] || null;
  }

  /**
   * Marquer une demande comme traitée
   */
  async markHandled(requestId) {
    const query = `
      UPDATE assistance_requests
      SET status = 'handled', handled_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [requestId]);
    return result.rows[0];
  }

  /**
   * Récupérer les demandes d'une table
   */
  async findByTable(tableId, options = {}) {
    const { status, limit = 20 } = options;
    
    let whereConditions = ['ar.table_id = $1'];
    let values = [tableId];
    let paramIndex = 2;
    
    if (status) {
      whereConditions.push(`ar.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        ar.*,
        t.table_number
      FROM assistance_requests ar
      JOIN tables t ON t.id = ar.table_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ar.requested_at DESC
      LIMIT $${paramIndex}
    `;
    
    values.push(limit);
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Vérifier si une table a déjà une demande en attente
   */
  async hasPendingRequest(tableId) {
    const query = `
      SELECT id FROM assistance_requests
      WHERE table_id = $1 AND status = 'pending'
      LIMIT 1
    `;
    
    const result = await pool.query(query, [tableId]);
    return result.rows.length > 0;
  }
}

module.exports = new AssistanceModel();

