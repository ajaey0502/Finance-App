const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const { validateBudgetData } = require('../middleware/validator');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const ALERT_THRESHOLD = 80;

function getPeriodStart(period, referenceDate) {
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  return period === 'monthly'
    ? new Date(ref.getFullYear(), ref.getMonth(), 1)
    : new Date(ref.getFullYear(), 0, 1);
}

async function createBudget(userId, data) {
  try {
    validateBudgetData(data);

    const budget = new Budget({ userId, ...data });
    await budget.save();

    logger.info(`[budgetService] Created budget for ${data.category} ($${data.limit})`);
    return budget;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(400, `Budget for ${data.category} (${data.period}) already exists`);
    }
    logger.error('[budgetService] Error creating budget:', error);
    throw error;
  }
}

async function getBudgets(userId, period) {
  try {
    const query = { userId };
    if (period) {
      query.period = period;
    }

    return Budget.find(query).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('[budgetService] Error fetching budgets:', error);
    throw error;
  }
}

async function getBudgetById(userId, budgetId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      throw new AppError(400, 'Invalid budget ID');
    }

    const budget = await Budget.findOne({
      _id: budgetId,
      userId,
    });

    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }

    return budget;
  } catch (error) {
    logger.error('[budgetService] Error fetching budget:', error);
    throw error;
  }
}

async function updateBudget(userId, budgetId, data) {
  try {
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      throw new AppError(400, 'Invalid budget ID');
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: budgetId, userId },
      { ...data, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }

    logger.info(`[budgetService] Updated budget ${budgetId}`);
    return budget;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(400, 'Budget for this category and period already exists');
    }
    logger.error('[budgetService] Error updating budget:', error);
    throw error;
  }
}

async function deleteBudget(userId, budgetId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      throw new AppError(400, 'Invalid budget ID');
    }

    const result = await Budget.deleteOne({
      _id: budgetId,
      userId,
    });

    if (result.deletedCount === 0) {
      throw new AppError(404, 'Budget not found');
    }

    logger.info(`[budgetService] Deleted budget ${budgetId}`);
  } catch (error) {
    logger.error('[budgetService] Error deleting budget:', error);
    throw error;
  }
}

async function calculateBudgetSpent(userId, category, period, referenceDate = new Date()) {
  try {
    const startDate = getPeriodStart(period, referenceDate);
    const objectId = new mongoose.Types.ObjectId(userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: objectId,
          category,
          type: 'expense',
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  } catch (error) {
    logger.error('[budgetService] Error calculating budget spent:', error);
    throw error;
  }
}

/**
 * Compute spend for a batch of categories sharing the same period in a single
 * aggregation, avoiding one round-trip per budget.
 */
async function calculateSpentForCategories(userId, categories, period, referenceDate) {
  if (categories.length === 0) return new Map();

  const startDate = getPeriodStart(period, referenceDate);
  const objectId = new mongoose.Types.ObjectId(userId);

  const rows = await Transaction.aggregate([
    {
      $match: {
        userId: objectId,
        category: { $in: categories },
        type: 'expense',
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
  ]);

  return new Map(rows.map((row) => [row._id, row.total]));
}

async function getAllBudgetsWithUsage(userId, period, referenceDate = new Date()) {
  try {
    const budgets = await getBudgets(userId, period);
    if (budgets.length === 0) return [];

    const monthlyCategories = budgets.filter((b) => b.period === 'monthly').map((b) => b.category);
    const yearlyCategories = budgets.filter((b) => b.period === 'yearly').map((b) => b.category);

    const [monthlySpend, yearlySpend] = await Promise.all([
      calculateSpentForCategories(userId, monthlyCategories, 'monthly', referenceDate),
      calculateSpentForCategories(userId, yearlyCategories, 'yearly', referenceDate),
    ]);

    const budgetsWithUsage = budgets.map((budget) => {
      const spendMap = budget.period === 'monthly' ? monthlySpend : yearlySpend;
      const spent = spendMap.get(budget.category) || 0;
      const percentageSpent = (spent / budget.limit) * 100;

      return {
        budgetId: budget._id.toString(),
        category: budget.category,
        limit: budget.limit,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round((budget.limit - spent) * 100) / 100,
        percentageSpent: Math.round(percentageSpent * 100) / 100,
        period: budget.period,
        isAlert: percentageSpent >= ALERT_THRESHOLD,
        status:
          percentageSpent >= 100
            ? 'over-budget'
            : percentageSpent >= ALERT_THRESHOLD
              ? 'warning'
              : 'ok',
      };
    });

    logger.info(`[budgetService] Got usage for ${budgetsWithUsage.length} budgets`);
    return budgetsWithUsage;
  } catch (error) {
    logger.error('[budgetService] Error getting budgets with usage:', error);
    throw error;
  }
}

async function getBudgetAlerts(userId, period, referenceDate = new Date()) {
  try {
    const budgetsWithUsage = await getAllBudgetsWithUsage(userId, period, referenceDate);
    const alerts = budgetsWithUsage
      .filter((b) => b.isAlert)
      .map((b) => ({
        budget: { _id: b.budgetId, category: b.category, limit: b.limit, period: b.period },
        spent: b.spent,
        threshold: Math.round(b.limit * (ALERT_THRESHOLD / 100) * 100) / 100,
        percentageSpent: b.percentageSpent,
      }));

    logger.info(`[budgetService] Found ${alerts.length} budget alerts`);
    return alerts;
  } catch (error) {
    logger.error('[budgetService] Error getting budget alerts:', error);
    throw error;
  }
}

async function checkBudgetAlerts(userId) {
  const alerts = await getBudgetAlerts(userId);
  return alerts.map((alert) => ({
    budget: alert.budget,
    spent: alert.spent,
    threshold: alert.threshold,
  }));
}

async function getBudgetSummary(userId, period, referenceDate = new Date()) {
  try {
    const budgets = await getAllBudgetsWithUsage(userId, period, referenceDate);

    const alerts = budgets.filter((b) => b.isAlert);
    const ok = budgets.filter((b) => !b.isAlert);

    return {
      total: budgets.length,
      withAlerts: alerts.length,
      ok: ok.length,
      alertThreshold: ALERT_THRESHOLD,
      budgets,
    };
  } catch (error) {
    logger.error('[budgetService] Error getting budget summary:', error);
    throw error;
  }
}

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  calculateBudgetSpent,
  getBudgetAlerts,
  checkBudgetAlerts,
  getAllBudgetsWithUsage,
  getBudgetSummary,
};
