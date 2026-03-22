const logger = require('../utils/logger');
const config = require('../config');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = err.errors;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry';
    details = err.detail;
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Foreign key violation';
  }

  // Build response
  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(config.nodeEnv === 'development' && {
      stack: err.stack,
      error: err.name,
    }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

/**
 * 404 handler for unknown routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorHandler, notFoundHandler };

