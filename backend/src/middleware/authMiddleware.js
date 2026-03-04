const rateLimit = require('express-rate-limit');
const { verifyAccessToken } = require('../utils/tokenUtils');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(401, 'Authorization header is missing');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Invalid authorization header format. Expected: Bearer <token>');
    }

    const token = authHeader.substring(7);

    if (!token || token.trim() === '') {
      throw new AppError(401, 'Token is empty or missing');
    }

    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.userId;
      req.email = payload.email;
      req.user = payload;

      logger.debug('Token verified successfully', { userId: payload.userId });
      next();
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        throw new AppError(401, 'Access token has expired. Please refresh your token.');
      } else if (tokenError.name === 'JsonWebTokenError') {
        throw new AppError(401, 'Invalid token. Token verification failed.');
      } else {
        throw new AppError(401, 'Token validation error');
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      logger.error('Authentication middleware error:', error);
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
}

function authenticateOptional(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = verifyAccessToken(token);
        req.userId = payload.userId;
        req.email = payload.email;
        req.user = payload;
        logger.debug('Optional auth token verified', { userId: payload.userId });
      } catch (error) {
        logger.debug('Optional auth token invalid, continuing as guest');
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.userId || !req.user) {
    const error = new AppError(401, 'Authentication required');
    res.status(401).json({
      success: false,
      error: error.message,
    });
  } else {
    next();
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many refresh attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authenticate,
  authenticateOptional,
  requireAuth,
  authLimiter,
  refreshLimiter,
};
