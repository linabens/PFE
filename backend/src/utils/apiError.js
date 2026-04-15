/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  static unprocessableEntity(message, details = null) {
    return new ApiError(422, message, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, null, false);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }
}

module.exports = ApiError;

