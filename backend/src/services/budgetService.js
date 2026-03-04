const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { AppError } = require('../middleware/errorHandler');
const { validateBudgetData } = require('../middleware/validator');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function createBudget(userId, data) {
  try {
    validateBudgetData(data);

    // Check if budget already exists for this category and period
    const existing = await Budget.findOne({
      userId,
      category: data.category,
      period: data.period,
    });

    if (existing) {
      throw new AppError(
        400,
        `Budget for ${data.category} (${data.period}) already exists`
      );
    }

    const budget = new Budget({
      userId,
      ...data,
    });

    logger.info(`[budgetService] Created budget for ${data.category} ($${data.limit})`);
    return budget.save();
  } catch (error) {
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

    // If updating category or period, check for duplicates
    if (data.category || data.period) {
      const existing = await Budget.findOne({
        userId,
        category: data.category,
        period: data.period,
        _id: { $ne: budgetId },
      });

      if (existing) {
        throw new AppError(
          400,
          `Budget for this category and period already exists`
        );
      }
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

async function calculateBudgetSpent(userId, category, period) {
  try {
    const now = new Date();
    let startDate;

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

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

async function getBudgetAlerts(userId, period) {
  try {
    let budgets = await getBudgets(userId, period);
    const alerts = [];

    for (const budget of budgets) {
      const spent = await calculateBudgetSpent(
        userId,
        budget.category,
        budget.period
      );
      const percentageSpent = (spent / budget.limit) * 100;

      if (percentageSpent >= 80) {
        alerts.push({
          budget,
          spent,
          threshold: budget.limit * 0.8,
          percentageSpent,
        });
      }
    }

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

async function getAllBudgetsWithUsage(userId, period) {
  try {
    let budgets = await getBudgets(userId, period);

    const budgetsWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await calculateBudgetSpent(
          userId,
          budget.category,
          budget.period
        );
        const percentageSpent = (spent / budget.limit) * 100;

        return {
          budgetId: budget._id.toString(),
          category: budget.category,
          limit: budget.limit,
          spent: Math.round(spent * 100) / 100,
          remaining: Math.round((budget.limit - spent) * 100) / 100,
          percentageSpent: Math.round(percentageSpent * 100) / 100,
          period: budget.period,
          isAlert: percentageSpent >= 80,
          status:
            percentageSpent >= 100
              ? 'over-budget'
              : percentageSpent >= 80
                ? 'warning'
                : 'ok',
        };
      })
    );

    logger.info(
      `[budgetService] Got usage for ${budgetsWithUsage.length} budgets`
    );
    return budgetsWithUsage;
  } catch (error) {
    logger.error('[budgetService] Error getting budgets with usage:', error);
    throw error;
  }
}

async function getBudgetSummary(userId, period) {
  try {
    const budgets = await getAllBudgetsWithUsage(userId, period);

    const alerts = budgets.filter((b) => b.isAlert);
    const ok = budgets.filter((b) => !b.isAlert);

    return {
      total: budgets.length,
      withAlerts: alerts.length,
      ok: ok.length,
      alertThreshold: 80,
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
