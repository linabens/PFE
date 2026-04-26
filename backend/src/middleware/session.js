const SessionModel = require('../models/SessionModel');
const ApiError = require('../utils/apiError');

const SESSION_ERROR_FR = {
  CLOSED: 'Session fermée. Rescannez le QR code à la table pour continuer.',
  EXPIRED: 'Session expirée. Rescannez le QR code à la table.',
  IDLE: 'Session inactive (trop longtemps sans activité). Rescannez le QR code.',
  NOT_FOUND: 'Session introuvable.',
};

/**
 * Middleware that ensures there is a valid session token on the request.
 * The token may be sent in the `x-session-token` header or as a query parameter.
 * If a valid session is found, it is attached to `req.session` for later use.
 */
async function authenticateSession(req, res, next) {
  try {
    const token =
      req.headers['x-session-token'] || req.query.session_token || req.body.session_token;
    if (!token) {
      throw ApiError.badRequest('Session token is required');
    }
    const session = await SessionModel.findByToken(token);
    if (!session) {
      throw ApiError.unauthorized('Invalid session token');
    }
    const v = SessionModel.validateSessionRow(session);
    if (!v.ok) {
      throw ApiError.unauthorized(SESSION_ERROR_FR[v.code] || 'Session invalide.');
    }
    const refreshed = await SessionModel.touch(token);
    if (!refreshed) {
      throw ApiError.unauthorized('Session expirée ou fermée.');
    }
    req.session = refreshed;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticateSession };
