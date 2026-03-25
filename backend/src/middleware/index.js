const { errorHandler, notFoundHandler } = require('./errorHandler');
const auth = require('./auth');
const session = require('./session');
const { orderCreateRateLimiter, createRateLimiter } = require('./rateLimit');

module.exports = {
  errorHandler,
  notFoundHandler,
  ...auth,
  ...session,
  orderCreateRateLimiter,
  createRateLimiter,
};

