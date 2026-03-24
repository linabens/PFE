const pool = require('../database/pool');
const GameModel = require('../models/GameModel');
const LoyaltyService = require('./LoyaltyService');
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
  async submitScore({ gameId, sessionId, tableId, score, metadata = {}, loyaltyAccountId = null }) {
    // Validate
    if (score < 0 || !Number.isInteger(score)) {
      throw ApiError.badRequest('Score invalide — doit être un entier positif.');
    }

    // Never trust the client: validate that the submitted score is plausible.
    // Prefer an exact cap based on IDs sent in metadata; otherwise fall back to a conservative cap.
    const maxAllowedScore = await this._getMaxAllowedScore(gameId, metadata);
    if (score > maxAllowedScore) {
      throw ApiError.badRequest(
        `Score invalide — maximum autorisé pour cette partie: ${maxAllowedScore}.`
      );
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

    // Créditer le compte fidélité si la session est liée (POST /api/sessions/loyalty)
    let loyaltyResult = null;
    if (rewardPoints > 0 && loyaltyAccountId) {
      loyaltyResult = await LoyaltyService.earnGameRewardPoints(loyaltyAccountId, rewardPoints);
    }

    return {
      ...gameSession,
      reward_points: rewardPoints,
      loyalty_points_added: loyaltyResult?.points_added ?? 0,
      loyalty_balance: loyaltyResult?.account?.points ?? null,
    };
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
  async _getMaxAllowedScore(gameId, metadata = {}) {
    const DEFAULTS = {
      QUIZ_LIMIT: 10,
      WORD_LIMIT: 5,
      PUZZLE_CAP: 100, // puzzles don't have per-item points in DB; keep a strict cap
    };

    const safeArrayOfInts = (value) => {
      if (!Array.isArray(value)) return null;
      const ints = value
        .map((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
        .filter((v) => Number.isInteger(v) && v > 0);
      return ints.length ? Array.from(new Set(ints)) : null;
    };

    // If the client provides IDs, we can compute an exact "max possible".
    const questionIds = safeArrayOfInts(metadata?.questionIds);
    if (questionIds) {
      // Optional per-round limit (still capped defensively).
      const rawLimit = typeof metadata?.limit === 'number' ? metadata.limit : parseInt(metadata?.limit, 10);
      const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, DEFAULTS.QUIZ_LIMIT) : DEFAULTS.QUIZ_LIMIT;

      const ids = questionIds.slice(0, limit);
      const result = await pool.query(
        `SELECT id, points
         FROM game_questions
         WHERE game_id = $1 AND is_active = true AND id = ANY($2::int[])`,
        [gameId, ids]
      );

      // If any ID is invalid / not part of this game, reject metadata and fall back to conservative cap.
      if (result.rows.length !== ids.length) {
        return await this._getConservativeMaxAllowedScore(gameId, DEFAULTS);
      }

      return result.rows.reduce((sum, r) => sum + (parseInt(r.points, 10) || 0), 0);
    }

    const wordIds = safeArrayOfInts(metadata?.wordIds);
    if (wordIds) {
      const rawLimit = typeof metadata?.limit === 'number' ? metadata.limit : parseInt(metadata?.limit, 10);
      const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, DEFAULTS.WORD_LIMIT) : DEFAULTS.WORD_LIMIT;

      const ids = wordIds.slice(0, limit);
      const result = await pool.query(
        `SELECT id, points
         FROM game_words
         WHERE game_id = $1 AND is_active = true AND id = ANY($2::int[])`,
        [gameId, ids]
      );

      if (result.rows.length !== ids.length) {
        return await this._getConservativeMaxAllowedScore(gameId, DEFAULTS);
      }

      return result.rows.reduce((sum, r) => sum + (parseInt(r.points, 10) || 0), 0);
    }

    return await this._getConservativeMaxAllowedScore(gameId, DEFAULTS);
  }

  async _getConservativeMaxAllowedScore(gameId, DEFAULTS) {
    // Compute a conservative cap from the DB without trusting client metadata.
    // - Quiz: sum of top N question points
    // - Word scramble: sum of top N word points
    // - Puzzle: strict fixed cap (no point table)
    const quiz = await pool.query(
      `SELECT COALESCE(SUM(points), 0) AS max_score
       FROM (
         SELECT points
         FROM game_questions
         WHERE game_id = $1 AND is_active = true
         ORDER BY points DESC, id DESC
         LIMIT $2
       ) q`,
      [gameId, DEFAULTS.QUIZ_LIMIT]
    );
    const quizMax = parseInt(quiz.rows?.[0]?.max_score, 10) || 0;

    const words = await pool.query(
      `SELECT COALESCE(SUM(points), 0) AS max_score
       FROM (
         SELECT points
         FROM game_words
         WHERE game_id = $1 AND is_active = true
         ORDER BY points DESC, id DESC
         LIMIT $2
       ) w`,
      [gameId, DEFAULTS.WORD_LIMIT]
    );
    const wordMax = parseInt(words.rows?.[0]?.max_score, 10) || 0;

    // If the game has quiz/word content, use the corresponding cap.
    // Otherwise, it’s probably a puzzle (or another type): apply a strict cap.
    if (quizMax > 0) return quizMax;
    if (wordMax > 0) return wordMax;
    return DEFAULTS.PUZZLE_CAP;
  }

  _scrambleWord(word) {
    // Stop recursion: for some inputs (ex: "AAA") it's impossible to scramble to a different string.
    if (typeof word !== 'string') return '';
    const original = word;
    const arrOriginal = original.split('');
    if (arrOriginal.length <= 1) return original;

    // If all characters are identical, every permutation equals the original.
    const allSame = arrOriginal.every((ch) => ch === arrOriginal[0]);
    if (allSame) return original;

    const maxAttempts = 10;

    const scrambleOnce = () => {
      const arr = arrOriginal.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.join('');
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const scrambled = scrambleOnce();
      if (scrambled !== original) return scrambled;
    }

    // Fallback: force a difference by swapping the first char with another different one.
    const arr = arrOriginal.slice();
    const first = arr[0];
    const swapIndex = arr.findIndex((ch) => ch !== first && ch !== undefined);
    if (swapIndex !== -1) {
      [arr[0], arr[swapIndex]] = [arr[swapIndex], arr[0]];
      const forced = arr.join('');
      if (forced !== original) return forced;
    }

    // As a last resort, return original (should only happen in edge-cases).
    return original;
  }
}

module.exports = new GameService();
