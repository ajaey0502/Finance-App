const analyticsService = require('../services/analyticsService');
const budgetService = require('../services/budgetService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function getMonthlySummary(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const months = req.query.months ? parseInt(req.query.months) : null;
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) : null;

    // Validate year and month if provided
    if ((year && (year < 1900 || year > 2100)) || (month && (month < 1 || month > 12))) {
      throw new AppError(400, 'Invalid year or month parameter');
    }

    logger.info(`[analyticsController] Getting monthly summary`);
    const summary = await analyticsService.getMonthlySummary(req.userId, months, year, month);

    res.status(200).json({
      success: true,
      data: summary,
      meta: {
        count: summary.length,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getCategoryBreakdown(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const months = req.query.months ? parseInt(req.query.months) : null;
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) : null;
    const type = req.query.type || 'expense';

    if (!['income', 'expense'].includes(type)) {
      throw new AppError(400, 'Invalid type parameter. Must be "income" or "expense"');
    }

    if ((year && (year < 1900 || year > 2100)) || (month && (month < 1 || month > 12))) {
      throw new AppError(400, 'Invalid year or month parameter');
    }

    logger.info(`[analyticsController] Getting category breakdown`);
    const breakdown = await analyticsService.getCategoryBreakdown(req.userId, months, type, year, month);

    const totalAmount = breakdown.reduce((sum, cat) => sum + cat.amount, 0);

    res.status(200).json({
      success: true,
      data: breakdown,
      meta: {
        count: breakdown.length,
        type,
        total: Math.round(totalAmount * 100) / 100,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getIncomeExpense(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const months = req.query.months ? parseInt(req.query.months) : 3;

    if (isNaN(months) || months < 1 || months > 120) {
      throw new AppError(400, 'Invalid months parameter. Must be between 1 and 120');
    }

    logger.info(`[analyticsController] Getting income vs expense for ${months} months`);
    const comparison = await analyticsService.getIncomeExpenseComparison(req.userId, months);

    const totalIncome = comparison.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = comparison.reduce((sum, item) => sum + item.expenses, 0);

    res.status(200).json({
      success: true,
      data: comparison,
      meta: {
        count: comparison.length,
        months,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getMonthOverMonth(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const months = req.query.months ? parseInt(req.query.months) : 6;

    if (isNaN(months) || months < 1 || months > 120) {
      throw new AppError(400, 'Invalid months parameter. Must be between 1 and 120');
    }

    logger.info(`[analyticsController] Getting month-over-month comparison for ${months} months`);
    const trends = await analyticsService.getMonthOverMonthComparison(req.userId, months);

    res.status(200).json({
      success: true,
      data: trends,
      meta: {
        count: trends.length,
        months,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getDailyTrends(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const days = req.query.days ? parseInt(req.query.days) : 30;

    if (isNaN(days) || days < 1 || days > 365) {
      throw new AppError(400, 'Invalid days parameter. Must be between 1 and 365');
    }

    logger.info(`[analyticsController] Getting daily trends for ${days} days`);
    const trends = await analyticsService.getDailyTrends(req.userId, days);

    const totalIncome = trends.reduce((sum, day) => sum + day.income, 0);
    const totalExpenses = trends.reduce((sum, day) => sum + day.expenses, 0);

    res.status(200).json({
      success: true,
      data: trends,
      meta: {
        count: trends.length,
        days,
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        totalBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getTopCategories(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const months = req.query.months ? parseInt(req.query.months) : 1;
    const type = req.query.type || 'expense';

    if (isNaN(limit) || limit < 1 || limit > 20) {
      throw new AppError(400, 'Invalid limit parameter. Must be between 1 and 20');
    }

    if (isNaN(months) || months < 1 || months > 120) {
      throw new AppError(400, 'Invalid months parameter. Must be between 1 and 120');
    }

    if (!['income', 'expense'].includes(type)) {
      throw new AppError(400, 'Invalid type parameter. Must be "income" or "expense"');
    }

    logger.info(
      `[analyticsController] Getting top ${limit} categories for ${months} months, type: ${type}`
    );

    const categories = await analyticsService.getTopCategories(
      req.userId,
      limit,
      months,
      type
    );

    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);

    res.status(200).json({
      success: true,
      data: categories,
      meta: {
        count: categories.length,
        limit,
        months,
        type,
        total: Math.round(totalAmount * 100) / 100,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getSummaryStatistics(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const months = req.query.months ? parseInt(req.query.months) : null;
    const year = req.query.year ? parseInt(req.query.year) : null;
    const month = req.query.month ? parseInt(req.query.month) : null;

    if ((year && (year < 1900 || year > 2100)) || (month && (month < 1 || month > 12))) {
      throw new AppError(400, 'Invalid year or month parameter');
    }

    logger.info(`[analyticsController] Getting summary statistics`);
    const stats = await analyticsService.getSummaryStatistics(req.userId, months, year, month);

    res.status(200).json({
      success: true,
      data: stats,
      meta: {
        months,
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getDashboard(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const months = req.query.months ? parseInt(req.query.months) : 6;

    if (isNaN(months) || months < 1 || months > 120) {
      throw new AppError(400, 'Invalid months parameter. Must be between 1 and 120');
    }

    logger.info(`[analyticsController] Getting dashboard for ${months} months`);

    const [
      monthlySummary,
      categoryBreakdown,
      incomeExpense,
      monthOverMonth,
      topCategories,
      summary,
    ] = await Promise.all([
      analyticsService.getMonthlySummary(req.userId, months),
      analyticsService.getCategoryBreakdown(req.userId, 1, 'expense'),
      analyticsService.getIncomeExpenseComparison(req.userId, months),
      analyticsService.getMonthOverMonthComparison(req.userId, months),
      analyticsService.getTopCategories(req.userId, 5, 1, 'expense'),
      analyticsService.getSummaryStatistics(req.userId, 1),
    ]);

    // Calculate percent change from last month
    let percentChange = 0;
    if (monthlySummary && monthlySummary.length >= 2) {
      const sortedMonths = [...monthlySummary].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      
      const currentExpenses = sortedMonths[0]?.totalExpenses || 0;
      const lastExpenses = sortedMonths[1]?.totalExpenses || 0;
      if (lastExpenses > 0) {
        percentChange = ((currentExpenses - lastExpenses) / lastExpenses) * 100;
      }
    }

    // Get top category
    let topCategory = null;
    logger.info('[analyticsController] Category breakdown:', JSON.stringify(categoryBreakdown));
    if (categoryBreakdown && categoryBreakdown.length > 0) {
      const sorted = [...categoryBreakdown].sort((a, b) => (b.amount || 0) - (a.amount || 0));
      const topItem = sorted[0];
      logger.info('[analyticsController] Top item:', JSON.stringify(topItem));
      if (topItem && topItem.category) {
        topCategory = {
          name: topItem.category,
          amount: topItem.amount || 0
        };
        logger.info('[analyticsController] Set topCategory:', JSON.stringify(topCategory));
      }
    } else {
      logger.warn('[analyticsController] Category breakdown is empty or null');
    }

    res.status(200).json({
      success: true,
      data: {
        summary: {
          ...summary,
          percentChange: Math.round(percentChange * 10) / 10,
          topCategory,
        },
        monthlySummary,
        categoryBreakdown,
        incomeExpense,
        monthOverMonth,
        topCategories,
      },
      meta: {
        months,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

async function getBudgetAlerts(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const period = req.query.period;

    if (period && !['monthly', 'yearly'].includes(period)) {
      throw new AppError(400, 'Period must be either "monthly" or "yearly"');
    }

    logger.info(
      `[analyticsController] Getting budget alerts${period ? ` for ${period}` : ''}`
    );

    const alerts = await budgetService.getBudgetAlerts(req.userId, period);

    const formattedAlerts = alerts.map((alert) => {
      const percentageSpent = (alert.spent / alert.budget.limit) * 100;
      const severity = percentageSpent >= 100 ? 'critical' : 'warning';
      const message =
        severity === 'critical'
          ? `You have exceeded your ${alert.budget.category} budget by $${(alert.spent - alert.budget.limit).toFixed(2)}!`
          : `You have spent ${percentageSpent.toFixed(1)}% of your ${alert.budget.category} budget`;

      return {
        budgetId: alert.budget._id.toString(),
        category: alert.budget.category,
        limit: alert.budget.limit,
        spent: Math.round(alert.spent * 100) / 100,
        remaining: Math.round((alert.budget.limit - alert.spent) * 100) / 100,
        percentageSpent: Math.round(percentageSpent * 100) / 100,
        period: alert.budget.period,
        severity,
        message,
        threshold: alert.threshold,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedAlerts,
      meta: {
        count: formattedAlerts.length,
        alertThreshold: 80,
        period: period || 'all',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAnalyticsError(error, req, res);
  }
}

function handleAnalyticsError(error, req, res) {
  if (error instanceof AppError) {
    logger.warn(
      `[analyticsController] AppError: ${error.statusCode} - ${error.message}`
    );
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  } else {
    logger.error('[analyticsController] Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

module.exports = {
  getMonthlySummary,
  getCategoryBreakdown,
  getIncomeExpense,
  getMonthOverMonth,
  getDailyTrends,
  getTopCategories,
  getSummaryStatistics,
  getDashboard,
  getBudgetAlerts,
};
