const express = require('express');
const router = express.Router();
const GameModel   = require('../models/GameModel');
const GameService = require('../services/GameService');
const { authenticateSession, authenticateToken, authorizeRoles } = require('../middleware');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (accessible par tous les clients)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/games
 * Liste tous les jeux actifs
 */
router.get('/', async (req, res, next) => {
  try {
    const games = await GameService.listGames();
    res.json({ success: true, data: games });
  } catch (err) { next(err); }
});

/**
 * GET /api/games/:id
 * Détails d'un jeu
 */
router.get('/:id', async (req, res, next) => {
  try {
    const game = await GameService.getGameById(parseInt(req.params.id));
    res.json({ success: true, data: game });
  } catch (err) { next(err); }
});

/**
 * GET /api/games/:id/leaderboard
 * Meilleurs scores d'un jeu (public — encourage la compétition)
 */
router.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const scores = await GameService.getLeaderboard(
      parseInt(req.params.id),
      req.query.limit ? parseInt(req.query.limit) : 10
    );
    res.json({ success: true, data: scores });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ ROUTES (session requise)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/games/:id/questions
 * Récupère des questions aléatoires pour le quiz
 * ?limit=10
 */
router.get('/:id/questions', authenticateSession, async (req, res, next) => {
  try {
    const questions = await GameService.getQuizQuestions(
      parseInt(req.params.id),
      req.query.limit ? parseInt(req.query.limit) : 10
    );
    res.json({ success: true, data: questions, count: questions.length });
  } catch (err) { next(err); }
});

/**
 * POST /api/games/:id/answer
 * Vérifier la réponse à une question de quiz
 * Body: { questionId, answer }  — answer = 'a' | 'b' | 'c' | 'd'
 */
router.post('/:id/answer', authenticateSession, async (req, res, next) => {
  try {
    const { questionId, answer } = req.body;
    if (!questionId || !answer) {
      return res.status(400).json({ success: false, error: 'questionId et answer sont requis' });
    }
    const result = await GameService.checkAnswer(parseInt(questionId), answer);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUZZLE ROUTES (session requise)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/games/:id/puzzle
 * Récupère un puzzle aléatoire pour ce jeu
 */
router.get('/:id/puzzle', authenticateSession, async (req, res, next) => {
  try {
    const puzzle = await GameService.getPuzzleData(parseInt(req.params.id));
    res.json({ success: true, data: puzzle });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// WORD SCRAMBLE ROUTES (session requise)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/games/:id/words
 * Récupère des mots mélangés pour jouer
 * ?limit=5
 */
router.get('/:id/words', authenticateSession, async (req, res, next) => {
  try {
    const words = await GameService.getWordScrambleRound(
      parseInt(req.params.id),
      req.query.limit ? parseInt(req.query.limit) : 5
    );
    res.json({ success: true, data: words, count: words.length });
  } catch (err) { next(err); }
});

/**
 * POST /api/games/:id/words/:wordId/check
 * Vérifier si la réponse au mot mélangé est correcte
 * Body: { answer }
 */
router.post('/:id/words/:wordId/check', authenticateSession, async (req, res, next) => {
  try {
    const { answer } = req.body;
    if (!answer) {
      return res.status(400).json({ success: false, error: 'answer est requis' });
    }
    const result = await GameService.checkWordAnswer(parseInt(req.params.wordId), answer);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// SCORE SUBMISSION (session requise)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/games/:id/score
 * Soumettre le score final d'une partie
 * Body: { score, metadata (optionnel) }
 */
router.post('/:id/score', authenticateSession, async (req, res, next) => {
  try {
    const { score, metadata } = req.body;
    if (score === undefined || score === null) {
      return res.status(400).json({ success: false, error: 'Le score est requis' });
    }

    const result = await GameService.submitScore({
      gameId:    parseInt(req.params.id),
      sessionId: req.session?.id,
      tableId:   req.session?.table_id,
      score:     parseInt(score),
      metadata,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: `Partie enregistrée ! Vous gagnez ${result.reward_points} point(s) de fidélité. 🎉`,
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/games/:id/my-scores
 * Scores de la table courante pour un jeu (historique de session)
 */
router.get('/:id/my-scores', authenticateSession, async (req, res, next) => {
  try {
    const scores = await GameService.getSessionScores(
      parseInt(req.params.id),
      req.session?.table_id
    );
    res.json({ success: true, data: scores });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES (JWT requis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/games/:id/statistics
 * Statistiques globales d'un jeu (admin/staff)
 */
router.get('/:id/statistics', authenticateToken, authorizeRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const stats = await GameService.getStats(parseInt(req.params.id));
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

/**
 * GET /api/games/:id/scores
 * Tous les scores d'un jeu avec filtres avancés (admin/staff)
 */
router.get('/:id/scores', authenticateToken, authorizeRoles('staff', 'admin'), async (req, res, next) => {
  try {
    const scores = await GameModel.getHighScores(
      parseInt(req.params.id),
      req.query.limit ? parseInt(req.query.limit) : 50
    );
    res.json({ success: true, data: scores });
  } catch (err) { next(err); }
});

/**
 * PATCH /api/games/:id
 * Activer/désactiver un jeu (admin)
 * Body: { is_active: true|false }
 */
router.patch('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return res.status(400).json({ success: false, error: 'is_active est requis' });
    }
    const result = await pool.query(
      'UPDATE games SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, parseInt(req.params.id)]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'Jeu non trouvé' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
