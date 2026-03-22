const { errorHandler, notFoundHandler } = require('./errorHandler');
const auth = require('./auth');
const session = require('./session');

module.exports = {
  errorHandler,
  notFoundHandler,
  ...auth,
  ...session,
};

