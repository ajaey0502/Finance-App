require('dotenv').config();

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'GEMINI_API_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const config = {
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

module.exports = config;
