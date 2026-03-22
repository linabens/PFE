const SessionModel = require('../models/SessionModel');
const ApiError = require('../utils/apiError');

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
    // update last active timestamp
    await SessionModel.touch(token);
    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticateSession };
