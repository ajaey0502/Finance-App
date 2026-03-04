const { verifyAccessToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    req.userId = payload.userId;
    req.email = payload.email;

    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
