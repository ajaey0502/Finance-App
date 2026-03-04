const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
    process.exit(1);
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  default: mongoose,
};
