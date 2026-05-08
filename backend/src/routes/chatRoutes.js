const express = require('express');
const router = express.Router();
const chat = require('../controllers/chatController');

/**
 * POST /api/chat/message
 * Send a message to Luna and get a RAG-powered response.
 * Header: x-session-token
 * Body:   { message: string }
 */
router.post('/message', chat.sendMessage);

/**
 * GET /api/chat/history
 * Return the conversation history for the current session.
 * Header: x-session-token
 * Query:  ?limit=50 (max 100)
 */
router.get('/history', chat.getHistory);

/**
 * DELETE /api/chat/history
 * Clear all messages for the current session.
 * Header: x-session-token
 */
router.delete('/history', chat.clearHistory);

/**
 * GET /api/chat/preferences
 * Get remembered preferences for this session.
 * Header: x-session-token
 */
router.get('/preferences', chat.getPreferences);

/**
 * PUT /api/chat/preferences
 * Save or update session preferences Luna uses for personalization.
 * Header: x-session-token
 * Body:   { milk_type, budget_limit, dietary_tags[], language }
 */
router.put('/preferences', chat.updatePreferences);

module.exports = router;
