const pool = require('../database/pool');
const GameModel = require('../models/GameModel');
const ApiError = require('../utils/apiError');

// ── Game Types ────────────────────────────────────────────────────────────────
const GAME_SLUGS = {
  QUIZ: 'quiz',
  PUZZLE: 'puzzle',
  WORD_SCRAMBLE: 'word_scramble',
};

// Max plays per session per game (anti-cheat)
const MAX_PLAYS_PER_SESSION = 3;

class GameService {

  // ── List ─────────────────────────────────────────────────────────────────────
  async listGames() {
    return GameModel.findAllActive();
  }

  async getGameById(gameId) {
    const game = await GameModel.findById(gameId);
    if (!game) throw ApiError.notFound('Jeu introuvable.');
    return game;
  }

  // ── Questions for Quiz ────────────────────────────────────────────────────────
  async getQuizQuestions(gameId, limit = 10) {
    const result = await pool.query(
      `SELECT id, question, option_a, option_b, option_c, option_d, difficulty
       FROM game_questions
       WHERE game_id = $1 AND is_active = true
       ORDER BY RANDOM()
       LIMIT $2`,
      [gameId, limit]
    );
    return result.rows; // Correct answer NOT sent to client
  }

  // ── Check a single quiz answer ────────────────────────────────────────────────
  async checkAnswer(questionId, answer) {
    const result = await pool.query(
      'SELECT correct_answer, points FROM game_questions WHERE id = $1',
      [questionId]
    );
    const q = result.rows[0];
    if (!q) throw ApiError.notFound('Question introuvable.');
    const isCorrect = q.correct_answer.toLowerCase() === answer.toLowerCase();
    return { isCorrect, points: isCorrect ? q.points : 0 };
  }

  // ── Puzzle data ───────────────────────────────────────────────────────────────
  async getPuzzleData(gameId) {
    const result = await pool.query(
      `SELECT id, image_url, grid_size, difficulty
       FROM game_puzzles
       WHERE game_id = $1 AND is_active = true
       ORDER BY RANDOM()
       LIMIT 1`,
      [gameId]
    );
    if (result.rows.length === 0) {
      throw ApiError.notFound('Aucun puzzle disponible pour ce jeu.');
    }
    return result.rows[0];
  }

  // ── Word Scramble data ────────────────────────────────────────────────────────
  async getWordScrambleRound(gameId, limit = 5) {
    const result = await pool.query(
      `SELECT id, original_word, hint, category, points
       FROM game_words
       WHERE game_id = $1 AND is_active = true
       ORDER BY RANDOM()
       LIMIT $2`,
      [gameId, limit]
    );
    // Return scrambled word, not original
    return result.rows.map(w => ({
      id: w.id,
      scrambled: this._scrambleWord(w.original_word),
      hint: w.hint,
      category: w.category,
      points: w.points,
    }));
  }

  // ── Check scramble answer ─────────────────────────────────────────────────────
  async checkWordAnswer(wordId, answer) {
    const result = await pool.query(
      'SELECT original_word, points FROM game_words WHERE id = $1',
      [wordId]
    );
    const w = result.rows[0];
    if (!w) throw ApiError.notFound('Mot introuvable.');
    const isCorrect = w.original_word.toLowerCase() === answer.toLowerCase().trim();
    return { isCorrect, points: isCorrect ? w.points : 0, correct: w.original_word };
  }

  // ── Submit final score ────────────────────────────────────────────────────────
  async submitScore({ gameId, sessionId, tableId, score, metadata = {} }) {
    // Validate
    if (score < 0 || !Number.isInteger(score)) {
      throw ApiError.badRequest('Score invalide — doit être un entier positif.');
    }

    // Anti-cheat: check play count for this session
    if (sessionId) {
      const count = await pool.query(
        'SELECT COUNT(*) FROM game_sessions WHERE game_id = $1 AND session_id = $2',
        [gameId, sessionId]
      );
      if (parseInt(count.rows[0].count) >= MAX_PLAYS_PER_SESSION) {
        throw ApiError.badRequest(
          `Limite atteinte — maximum ${MAX_PLAYS_PER_SESSION} parties par session pour ce jeu.`
        );
      }
    }

    // Calculate reward points (1 reward pt per 20 score pts)
    const rewardPoints = Math.floor(score / 20);

    const gameSession = await GameModel.createSession({
      game_id: gameId,
      session_id: sessionId || null,
      table_id: tableId || null,
      score,
      reward_points: rewardPoints,
    });

    return { ...gameSession, reward_points: rewardPoints };
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────────
  async getLeaderboard(gameId, limit = 10) {
    return GameModel.getHighScores(gameId, limit);
  }

  // ── My scores (for this session's table) ─────────────────────────────────────
  async getSessionScores(gameId, tableId) {
    return GameModel.findByTable(gameId, tableId, 10);
  }

  // ── Admin: stats ──────────────────────────────────────────────────────────────
  async getStats(gameId) {
    return GameModel.getStatistics(gameId);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────────
  _scrambleWord(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Ensure the scrambled version differs from the original
    const scrambled = arr.join('');
    return scrambled === word ? this._scrambleWord(word) : scrambled;
  }
}

module.exports = new GameService();
