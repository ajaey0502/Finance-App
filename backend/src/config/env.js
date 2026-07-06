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
    // 'gemini-pro' and 'gemini-1.5-flash' were both retired by Google.
    // The '-latest' alias isn't resolvable on the v1 API this SDK version
    // targets, so pin to a concrete, currently-supported model instead.
    // Override via env if it's deprecated again in the future.
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  cors: {
    // Comma-separated list so both a local dev origin and a deployed
    // frontend URL can be allowed at once, e.g.:
    // "http://localhost:5173,https://finsight.vercel.app"
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },
};

module.exports = config;
