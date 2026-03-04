const config = require('./env');

const jwtConfig = {
  accessToken: {
    secret: config.jwt.accessSecret,
    expiresIn: config.jwt.accessExpire,
  },
  refreshToken: {
    secret: config.jwt.refreshSecret,
    expiresIn: config.jwt.refreshExpire,
  },
};

module.exports = jwtConfig;
