const jwt = require('jsonwebtoken');
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

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
