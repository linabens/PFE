const pool = require('../database/pool');
const SessionModel = require('../models/SessionModel');
const ragService = require('../services/RagService');

const sessionModel = SessionModel; // exported as singleton instance

// ─── helpers ─────────────────────────────────────────────────────────────────

async function resolveSession(req, res) {
  const token = req.headers['x-session-token'] || req.body.session_token;
  if (!token) {
    res.status(401).json({ success: false, error: 'x-session-token header is required' });
    return null;
  }
  const session = await sessionModel.findByToken(token);
  const v = sessionModel.validateSessionRow(session);
  if (!v.ok) {
    res.status(401).json({ success: false, error: 'Session invalide ou expirée. Rescannez le QR code.' });
    return null;
  }
  // Refresh last_active_at
  await pool.query(`UPDATE sessions SET last_active_at = NOW() WHERE id = $1`, [session.id]);
  return session;
}

async function loadHistory(sessionId, limit = 12) {
  const res = await pool.query(
    `SELECT role, content FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sessionId, limit]
  );
  return res.rows.reverse(); // chronological order
}

async function loadPreferences(sessionId) {
  const res = await pool.query(
    `SELECT * FROM chat_preferences WHERE session_id = $1`,
    [sessionId]
  );
  return res.rows[0] || {};
}

async function saveMessages(sessionId, userMsg, assistantMsg, sources, confidence, response_ms) {
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
    [sessionId, userMsg]
  );
  await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, sources, confidence, response_ms)
     VALUES ($1, 'assistant', $2, $3, $4, $5)`,
    [sessionId, assistantMsg, JSON.stringify(sources), confidence, response_ms]
  );
}

// ─── POST /api/chat/message ──────────────────────────────────────────────────

exports.sendMessage = async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;

    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    const [history, preferences] = await Promise.all([
      loadHistory(session.id),
      loadPreferences(session.id),
    ]);

    const result = await ragService.query({
      message: message.trim(),
      history,
      preferences,
    });

    await saveMessages(
      session.id,
      message.trim(),
      result.response,
      result.sources,
      result.confidence,
      result.response_ms
    );

    res.json({
      success: true,
      data: {
        response:      result.response,
        sources:       result.sources,
        confidence:    result.confidence,
        low_confidence: result.low_confidence,
        response_ms:   result.response_ms,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/chat/history ───────────────────────────────────────────────────

exports.getHistory = async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const result = await pool.query(
      `SELECT id, role, content, sources, confidence, response_ms, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [session.id, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/chat/history ────────────────────────────────────────────────

exports.clearHistory = async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;

    await pool.query(`DELETE FROM chat_messages WHERE session_id = $1`, [session.id]);
    res.json({ success: true, message: 'Conversation cleared.' });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/chat/preferences ───────────────────────────────────────────────

exports.updatePreferences = async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;

    const { milk_type, budget_limit, dietary_tags, language } = req.body;

    await pool.query(
      `INSERT INTO chat_preferences (session_id, milk_type, budget_limit, dietary_tags, language, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (session_id) DO UPDATE
         SET milk_type    = EXCLUDED.milk_type,
             budget_limit = EXCLUDED.budget_limit,
             dietary_tags = EXCLUDED.dietary_tags,
             language     = EXCLUDED.language,
             updated_at   = NOW()`,
      [
        session.id,
        milk_type   || null,
        budget_limit || null,
        dietary_tags?.length ? dietary_tags : null,
        language    || 'fr',
      ]
    );

    res.json({ success: true, message: 'Preferences updated.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/chat/preferences ───────────────────────────────────────────────

exports.getPreferences = async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;

    const prefs = await loadPreferences(session.id);
    res.json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
};
