const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const transactionService = require('./src/services/transactionService');

const RECURRING_TRANSACTIONS_INTERVAL_MS = 60 * 60 * 1000; // hourly

function startRecurringTransactionsJob() {
  const runJob = () => {
    transactionService.processAllUsersRecurringTransactions().catch((error) => {
      logger.error('Recurring transactions job failed:', error);
    });
  };

  // Run once shortly after boot to catch up on anything missed while offline,
  // then keep users' budgets/analytics/forecasts fresh on a regular cadence.
  setTimeout(runJob, 10 * 1000);
  setInterval(runJob, RECURRING_TRANSACTIONS_INTERVAL_MS);
}

async function startServer() {
  try {
    await connectDatabase();
    logger.info('Database connected');

    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });

    startRecurringTransactionsJob();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
