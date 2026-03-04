const budgetService = require('../services/budgetService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function createBudget(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { category, limit, period } = req.body;

    if (!category || typeof category !== 'string') {
      throw new AppError(400, 'Category is required and must be a string');
    }

    if (!limit || typeof limit !== 'number' || limit <= 0) {
      throw new AppError(400, 'Limit is required and must be a positive number');
    }

    if (!period || !['monthly', 'yearly'].includes(period)) {
      throw new AppError(400, 'Period must be either "monthly" or "yearly"');
    }

    logger.info(
      `[budgetController] Creating budget for ${category} with limit $${limit} (${period})`
    );

    const budget = await budgetService.createBudget(req.userId, {
      category,
      limit,
      period,
    });

    res.status(201).json({
      success: true,
      data: budget,
      message: `Budget created for ${category}`,
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function getBudgets(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const period = req.query.period;

    if (period && !['monthly', 'yearly'].includes(period)) {
      throw new AppError(400, 'Period must be "monthly" or "yearly"');
    }

    logger.info('[budgetController] Fetching budgets');

    let budgets = await budgetService.getBudgets(req.userId);

    if (period) {
      budgets = budgets.filter((b) => b.period === period);
    }

    res.status(200).json({
      success: true,
      data: budgets,
      meta: {
        count: budgets.length,
        period: period || 'all',
      },
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function getBudgetById(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Budget ID is required');
    }

    logger.info(`[budgetController] Getting budget ${id}`);

    const budget = await budgetService.getBudgetById(req.userId, id);

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function updateBudget(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { id } = req.params;
    const { category, limit, period } = req.body;

    if (!id) {
      throw new AppError(400, 'Budget ID is required');
    }

    if (category && typeof category !== 'string') {
      throw new AppError(400, 'Category must be a string');
    }

    if (limit !== undefined && (typeof limit !== 'number' || limit <= 0)) {
      throw new AppError(400, 'Limit must be a positive number');
    }

    if (period && !['monthly', 'yearly'].includes(period)) {
      throw new AppError(400, 'Period must be "monthly" or "yearly"');
    }

    const updateData = {};
    if (category) updateData.category = category;
    if (limit) updateData.limit = limit;
    if (period) updateData.period = period;

    logger.info(`[budgetController] Updating budget ${id}`, updateData);

    const budget = await budgetService.updateBudget(req.userId, id, updateData);

    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function deleteBudget(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Budget ID is required');
    }

    logger.info(`[budgetController] Deleting budget ${id}`);

    await budgetService.deleteBudget(req.userId, id);

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function getBudgetUsage(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Budget ID is required');
    }

    logger.info(`[budgetController] Getting usage for budget ${id}`);

    const budget = await budgetService.getBudgetById(req.userId, id);
    const spent = await budgetService.calculateBudgetSpent(
      req.userId,
      budget.category,
      budget.period
    );

    const percentageSpent = (spent / budget.limit) * 100;
    const remaining = budget.limit - spent;
    const isAlert = percentageSpent >= 80;

    res.status(200).json({
      success: true,
      data: {
        budgetId: budget._id,
        category: budget.category,
        limit: budget.limit,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentageSpent: Math.round(percentageSpent * 100) / 100,
        period: budget.period,
        isAlert,
        alertThreshold: 80,
        status:
          percentageSpent >= 100
            ? 'over-budget'
            : percentageSpent >= 80
              ? 'warning'
              : 'ok',
      },
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function getAllBudgetsWithUsage(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const period = req.query.period;

    if (period && !['monthly', 'yearly'].includes(period)) {
      throw new AppError(400, 'Period must be "monthly" or "yearly"');
    }

    logger.info('[budgetController] Getting all budgets with usage');

    let budgets = await budgetService.getBudgets(req.userId);

    if (period) {
      budgets = budgets.filter((b) => b.period === period);
    }

    const budgetsWithUsage = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await budgetService.calculateBudgetSpent(
          req.userId,
          budget.category,
          budget.period
        );
        const percentageSpent = (spent / budget.limit) * 100;

        return {
          budgetId: budget._id,
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

    const alerts = budgetsWithUsage.filter((b) => b.isAlert);
    const okBudgets = budgetsWithUsage.filter((b) => !b.isAlert);

    res.status(200).json({
      success: true,
      data: budgetsWithUsage,
      meta: {
        total: budgetsWithUsage.length,
        withAlerts: alerts.length,
        ok: okBudgets.length,
        period: period || 'all',
      },
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

async function getBudgetAlerts(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const period = req.query.period;

    if (period && !['monthly', 'yearly'].includes(period)) {
      throw new AppError(400, 'Period must be "monthly" or "yearly"');
    }

    logger.info('[budgetController] Getting budget alerts');

    const alerts = await budgetService.getBudgetAlerts(req.userId, period);

    const alertsWithStatus = alerts.map((alert) => ({
      budgetId: alert.budget._id,
      category: alert.budget.category,
      limit: alert.budget.limit,
      spent: Math.round(alert.spent * 100) / 100,
      remaining: Math.round((alert.budget.limit - alert.spent) * 100) / 100,
      percentageSpent: Math.round((alert.spent / alert.budget.limit) * 100 * 100) / 100,
      period: alert.budget.period,
      severity:
        (alert.spent / alert.budget.limit) * 100 >= 100 ? 'critical' : 'warning',
      message:
        (alert.spent / alert.budget.limit) * 100 >= 100
          ? `You have exceeded your ${alert.budget.category} budget!`
          : `You have spent ${Math.round((alert.spent / alert.budget.limit) * 100)}% of your ${alert.budget.category} budget`,
    }));

    res.status(200).json({
      success: true,
      data: alertsWithStatus,
      meta: {
        count: alertsWithStatus.length,
        period: period || 'all',
      },
    });
  } catch (error) {
    handleBudgetError(error, req, res);
  }
}

function handleBudgetError(error, req, res) {
  if (error instanceof AppError) {
    logger.warn(`[budgetController] AppError: ${error.statusCode} - ${error.message}`);
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  } else {
    logger.error('[budgetController] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetUsage,
  getAllBudgetsWithUsage,
  getBudgetAlerts,
};
