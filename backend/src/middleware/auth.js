const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/apiError');
const UserModel = require('../models/UserModel');

/**
 * Verify JWT token and attach user to request.
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw ApiError.unauthorized('Authorization header missing');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Invalid authorization format');
    }
    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw err; // let error handler format it
    }
    const user = await UserModel.findById(payload.sub);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// variant that does not throw if no token is provided
async function optionalAuthenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return next();
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }
    const token = parts[1];
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await UserModel.findById(payload.sub);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // ignore invalid token, proceed without user
    }
    return next();
  } catch (err) {
    next(err);
  }
}

/**
 * Restrict access based on roles. Accepts one or more roles.
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient privileges'));
    }
    next();
  };
}

module.exports = { authenticateToken, optionalAuthenticateToken, authorizeRoles };
