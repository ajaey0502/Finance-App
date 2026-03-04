const logger = require('../utils/logger');

class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

function errorHandler(err, _req, res, _next) {
  logger.error('Error:', {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
};
