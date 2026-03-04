const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');

async function startServer() {
  try {
    await connectDatabase();
    logger.info('Database connected');

    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
