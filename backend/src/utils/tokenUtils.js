const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jwtConfig = require('../config/jwt');

function generateAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessToken.secret, {
    expiresIn: jwtConfig.accessToken.expiresIn,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshToken.secret, {
    expiresIn: jwtConfig.refreshToken.expiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessToken.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshToken.secret);
}

function decodeToken(token) {
  return jwt.decode(token);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getTokenExpiry(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    throw new Error('Token has no expiry claim');
  }
  return new Date(decoded.exp * 1000);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  hashToken,
  getTokenExpiry,
};
