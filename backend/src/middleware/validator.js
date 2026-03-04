const { AppError } = require('./errorHandler');

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function validateTransactionData(data) {
  const { amount, type, category, description, date, isRecurring, recurringFrequency, recurringEndDate } = data;

  if (amount === undefined || amount === null) {
    throw new AppError(400, 'Amount is required');
  }
  if (typeof amount !== 'number') {
    throw new AppError(400, 'Amount must be a number');
  }
  if (amount <= 0) {
    throw new AppError(400, 'Amount must be greater than 0');
  }
  if (amount > 999999999) {
    throw new AppError(400, 'Amount cannot exceed 999,999,999');
  }

  if (!type) {
    throw new AppError(400, 'Type is required (income or expense)');
  }
  if (!['income', 'expense'].includes(type)) {
    throw new AppError(400, 'Type must be either "income" or "expense"');
  }

  if (category !== undefined && category !== null) {
    if (typeof category !== 'string') {
      throw new AppError(400, 'Category must be a string');
    }
    if (category.trim().length < 2) {
      throw new AppError(400, 'Category must be at least 2 characters');
    }
    if (category.length > 50) {
      throw new AppError(400, 'Category cannot exceed 50 characters');
    }
  }

  if (!date) {
    throw new AppError(400, 'Date is required');
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    throw new AppError(400, 'Date must be a valid date');
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      throw new AppError(400, 'Description must be a string');
    }
    if (description.length > 500) {
      throw new AppError(400, 'Description cannot exceed 500 characters');
    }
  }

  if (isRecurring) {
    if (!recurringFrequency) {
      throw new AppError(400, 'Recurring frequency is required for recurring transactions');
    }
    if (!['daily', 'monthly', 'yearly'].includes(recurringFrequency)) {
      throw new AppError(400, 'Recurring frequency must be daily, monthly, or yearly');
    }
  }

  return true;
}

function validateBudgetData(data) {
  const { category, limit, period } = data;

  if (!category || typeof category !== 'string') {
    throw new AppError(400, 'Category is required');
  }

  if (!limit || typeof limit !== 'number' || limit <= 0) {
    throw new AppError(400, 'Valid limit is required');
  }

  if (!period || !['monthly', 'yearly'].includes(period)) {
    throw new AppError(400, 'Period must be monthly or yearly');
  }

  return true;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateTransactionData,
  validateBudgetData,
};
