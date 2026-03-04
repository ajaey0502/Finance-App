const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const { validateTransactionData } = require('../middleware/validator');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

async function createTransaction(userId, data) {
  validateTransactionData(data);

  let category = data.category;
  let categorizedByAI = data.categorizedByAI || false;

  // Auto-categorize expenses if no category provided or if requested
  if (data.type === 'expense' && (!category || data.categorizedByAI === true)) {
    try {
      const description = data.description || `Expense on ${new Date(data.date).toLocaleDateString()}`;
      const aiResult = await geminiService.categorizeExpense({
        description,
        amount: data.amount,
      });
      category = aiResult.category;
      categorizedByAI = aiResult.confidence > 0;
      logger.info('Auto-categorized expense:', {
        description,
        category,
        confidence: aiResult.confidence,
        amount: data.amount,
      });
    } catch (error) {
      logger.warn('Auto-categorization failed, using provided category or default', error);
      if (!category) {
        category = 'Other';
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

async function getTransactions(userId, filters) {
  let query = { userId };

  if (filters) {
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
  }

  return Transaction.find(query).sort({ date: -1 });
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
  if (updates.amount && updates.amount <= 0) {
    throw new AppError(400, 'Amount must be positive');
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

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
