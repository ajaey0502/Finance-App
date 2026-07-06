const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const { validateTransactionData } = require('../middleware/validator');
const aiService = require('./aiService');
const logger = require('../utils/logger');

const MAX_CATCH_UP_OCCURRENCES = 36; // safety cap per recurring series per call

async function createTransaction(userId, data) {
  validateTransactionData(data);

  let category = data.category;
  let categorizedByAI = data.categorizedByAI || false;

  // Auto-categorize expenses if no category provided or if requested.
  // Uses the same keyword -> cache -> AI -> fallback pipeline as the manual
  // suggestion endpoint so budgets (matched by exact category name) stay
  // consistent regardless of how a transaction's category was set.
  if (data.type === 'expense' && (!category || data.categorizedByAI === true)) {
    try {
      const description = data.description || `Expense on ${new Date(data.date).toLocaleDateString()}`;
      const aiResult = await aiService.categorizeExpense(userId, description);
      category = aiResult.category;
      categorizedByAI = aiResult.confidence > 0;
      logger.info('Auto-categorized expense:', {
        description,
        category,
        confidence: aiResult.confidence,
        source: aiResult.source,
        amount: data.amount,
      });
    } catch (error) {
      logger.warn('Auto-categorization failed, using provided category or default', error);
      if (!category) {
        category = 'Miscellaneous';
        categorizedByAI = false;
      }
    }
  }

  // For income, use provided category or default
  if (data.type === 'income' && !category) {
    category = 'Income';
  }

  const transaction = new Transaction({
    userId,
    ...data,
    category,
    categorizedByAI,
  });

  return transaction.save();
}

async function getTransactions(userId, filters = {}, pagination = {}) {
  await processDueRecurringTransactions(userId).catch((error) => {
    logger.error('[transactionService] Failed to process recurring transactions', error);
  });

  const query = { userId };

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = filters.startDate;
    if (filters.endDate) query.date.$lte = filters.endDate;
  }
  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = filters.category;

  const page = Math.max(1, parseInt(pagination.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(pagination.limit, 10) || 50));

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(query),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

async function getTransactionById(userId, transactionId) {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw new AppError(404, 'Transaction not found');
  }

  return transaction;
}

async function updateTransaction(userId, transactionId, updates) {
  if (updates.amount !== undefined) {
    if (typeof updates.amount !== 'number' || !Number.isFinite(updates.amount) || updates.amount <= 0) {
      throw new AppError(400, 'Amount must be a positive, finite number');
    }
    if (updates.amount > 999999999) {
      throw new AppError(400, 'Amount cannot exceed 999,999,999');
    }
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, userId },
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!transaction) {
    throw new AppError(404, 'Transaction not found');
  }

  return transaction;
}

async function deleteTransaction(userId, transactionId) {
  const result = await Transaction.deleteOne({
    _id: transactionId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, 'Transaction not found');
  }
}

/**
 * Compute the next occurrence date for a recurring transaction.
 */
function getNextOccurrence(date, frequency) {
  const next = new Date(date);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unknown recurring frequency: ${frequency}`);
  }
  return next;
}

/**
 * Materialize any occurrences of a user's recurring transactions that are
 * due but haven't been generated yet (e.g. because the server was offline,
 * or nothing has read this user's transactions since the due date).
 *
 * Each recurring series is a chain of transactions linked by
 * originalTransactionId, rooted at the transaction where the user first
 * turned on isRecurring. This walks each chain forward from its most recent
 * entry, creating new transactions for every elapsed interval up to now.
 */
async function processDueRecurringTransactions(userId) {
  const roots = await Transaction.find({
    userId,
    isRecurring: true,
    originalTransactionId: { $exists: false },
  });

  let createdCount = 0;

  for (const root of roots) {
    try {
      createdCount += await processRecurringSeries(userId, root);
    } catch (error) {
      logger.error('[transactionService] Failed to process recurring series', {
        userId,
        rootId: root._id.toString(),
        error: error.message,
      });
    }
  }

  if (createdCount > 0) {
    logger.info('[transactionService] Generated recurring transactions', { userId, createdCount });
  }

  return createdCount;
}

async function processRecurringSeries(userId, root) {
  if (!root.recurringFrequency) return 0;

  const latest = await Transaction.findOne({
    userId,
    $or: [{ _id: root._id }, { originalTransactionId: root._id }],
  }).sort({ date: -1 });

  if (!latest) return 0;

  const now = new Date();
  let nextDate = getNextOccurrence(latest.date, root.recurringFrequency);
  let created = 0;

  while (
    nextDate <= now &&
    (!root.recurringEndDate || nextDate <= root.recurringEndDate) &&
    created < MAX_CATCH_UP_OCCURRENCES
  ) {
    await new Transaction({
      userId,
      amount: root.amount,
      type: root.type,
      category: root.category,
      description: root.description,
      date: nextDate,
      isRecurring: true,
      recurringFrequency: root.recurringFrequency,
      recurringEndDate: root.recurringEndDate,
      originalTransactionId: root._id,
      categorizedByAI: root.categorizedByAI,
    }).save();

    created += 1;
    nextDate = getNextOccurrence(nextDate, root.recurringFrequency);
  }

  return created;
}

/**
 * Catch up recurring transactions for every user that has any, independent
 * of whether they've loaded their transaction list recently. Intended to be
 * called periodically (see server.js).
 */
async function processAllUsersRecurringTransactions() {
  const userIds = await Transaction.distinct('userId', { isRecurring: true });

  for (const userId of userIds) {
    await processDueRecurringTransactions(userId).catch((error) => {
      logger.error('[transactionService] Recurring catch-up failed for user', {
        userId: userId.toString(),
        error: error.message,
      });
    });
  }

  return userIds.length;
}

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  processDueRecurringTransactions,
  processAllUsersRecurringTransactions,
};
