const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const transactionService = require('../services/transactionService');

const router = express.Router();

router.use(authenticate);

router.post('/', asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw new AppError(401, 'User not authenticated');
  }

  const { amount, type, category, description, date, isRecurring, recurringFrequency, recurringEndDate } = req.body;

  const transactionData = {
    amount,
    type,
    category: category || undefined,
    description: description || undefined,
    date: date ? new Date(date) : new Date(),
    isRecurring: isRecurring || false,
    recurringFrequency: isRecurring ? recurringFrequency : undefined,
    recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : undefined,
  };

  const transaction = await transactionService.createTransaction(req.userId, transactionData);
  res.status(201).json({ success: true, data: transaction });
}));

router.get('/', asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw new AppError(401, 'User not authenticated');
  }

  const { month, year, type, category, startDate, endDate, page, limit } = req.query;

  const filters = {};

  if (month && year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new AppError(400, 'Invalid month. Must be between 1 and 12');
    }
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      throw new AppError(400, 'Invalid year. Must be between 1900 and 2100');
    }

    const startOfMonth = new Date(yearNum, monthNum - 1, 1);
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59);

    filters.startDate = startOfMonth;
    filters.endDate = endOfMonth;
  } else {
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new AppError(400, 'Invalid start date');
      }
      filters.startDate = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new AppError(400, 'Invalid end date');
      }
      filters.endDate = end;
    }
  }

  if (type) {
    if (!['income', 'expense'].includes(type)) {
      throw new AppError(400, 'Type must be either "income" or "expense"');
    }
    filters.type = type;
  }

  if (category) {
    filters.category = category;
  }

  const { transactions, pagination } = await transactionService.getTransactions(
    req.userId,
    filters,
    { page, limit }
  );
  res.status(200).json({
    success: true,
    message: 'Transactions retrieved successfully',
    data: transactions,
    meta: pagination,
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw new AppError(401, 'User not authenticated');
  }

  const transaction = await transactionService.getTransactionById(req.userId, req.params.id);
  res.status(200).json({ success: true, data: transaction });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw new AppError(401, 'User not authenticated');
  }

  const { amount, type, category, description, date, isRecurring, recurringFrequency, recurringEndDate } = req.body;

  const updates = {};
  if (amount !== undefined) updates.amount = amount;
  if (type !== undefined) updates.type = type;
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (date !== undefined) updates.date = date ? new Date(date) : undefined;
  if (isRecurring !== undefined) updates.isRecurring = isRecurring;
  if (recurringFrequency !== undefined) updates.recurringFrequency = recurringFrequency;
  if (recurringEndDate !== undefined) updates.recurringEndDate = recurringEndDate ? new Date(recurringEndDate) : null;

  const transaction = await transactionService.updateTransaction(
    req.userId,
    req.params.id,
    updates
  );
  res.status(200).json({ success: true, data: transaction });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!req.userId) {
    throw new AppError(401, 'User not authenticated');
  }

  await transactionService.deleteTransaction(req.userId, req.params.id);
  res.status(200).json({ success: true, message: 'Transaction deleted' });
}));

module.exports = router;
