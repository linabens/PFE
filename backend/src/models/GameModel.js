const pool = require('../database/pool');

class GameModel {
  /**
   * Récupérer tous les jeux actifs
   */
  async findAllActive() {
    const query = `
      SELECT * FROM games 
      WHERE is_active = true 
      ORDER BY name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Récupérer un jeu par ID
   */
  async findById(gameId) {
    const query = `SELECT * FROM games WHERE id = $1`;
    const result = await pool.query(query, [gameId]);
    return result.rows[0] || null;
  }

  /**
   * Créer une session de jeu
   */
  async createSession(sessionData, client = null) {
    const executor = client || pool;
    
    const query = `
      INSERT INTO game_sessions (game_id, user_id, table_id, score, reward_points, played_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await executor.query(query, [
      sessionData.game_id,
      sessionData.user_id || null,
      sessionData.table_id || null,
      sessionData.score || 0,
      sessionData.reward_points || 0,
    ]);
    
    return result.rows[0];
  }

  /**
   * Récupérer les sessions d'un jeu pour une table
   */
  async findByTable(gameId, tableId, limit = 10) {
    const query = `
      SELECT 
        gs.*,
        g.name as game_name
      FROM game_sessions gs
      JOIN games g ON g.id = gs.game_id
      WHERE gs.game_id = $1 AND gs.table_id = $2
      ORDER BY gs.score DESC, gs.played_at DESC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [gameId, tableId, limit]);
    return result.rows;
  }

  /**
   * Récupérer les meilleurs scores d'un jeu
   */
  async getHighScores(gameId, limit = 10) {
    const query = `
      SELECT 
        gs.score,
        gs.reward_points,
        gs.played_at,
        t.table_number
      FROM game_sessions gs
      LEFT JOIN tables t ON t.id = gs.table_id
      WHERE gs.game_id = $1
      ORDER BY gs.score DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [gameId, limit]);
    return result.rows;
  }

  /**
   * Récupérer les statistiques d'un jeu
   */
  async getStatistics(gameId) {
    const query = `
      SELECT 
        COUNT(*) as total_plays,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        SUM(reward_points) as total_rewards_given
      FROM game_sessions
      WHERE game_id = $1
    `;
    
    const result = await pool.query(query, [gameId]);
    return result.rows[0];
  }
}

module.exports = new GameModel();

