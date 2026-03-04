const forecastService = require('../services/forecastService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function generateForecast(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    let months = 3;
    if (req.query.months) {
      const parsed = parseInt(req.query.months);
      if (isNaN(parsed) || parsed < 3 || parsed > 6) {
        throw new AppError(
          400,
          'Months parameter must be a number between 3 and 6'
        );
      }
      months = parsed;
    }

    logger.info('[forecastController] Generating forecast', {
      userId: req.userId,
      months,
    });

    const forecast = await forecastService.generateForecast(req.userId, months);

    const savedForecast = await forecastService.saveForecast(
      req.userId,
      forecast
    );

    res.status(201).json({
      success: true,
      data: {
        month: savedForecast.month,
        predictedAmount: savedForecast.predictedAmount,
        currentSpending: forecast.currentSpending,
        insight: savedForecast.insight,
        confidence: forecast.confidence || 50,
        trend: forecast.trend || 'stable',
        confidenceInterval: forecast.confidenceInterval || { lower: 0, upper: 0 },
        basedOnMonths: savedForecast.basedOnMonths,
        breakdown: forecast.breakdown || null,
        topCategories: forecast.topCategories || [],
        createdAt: savedForecast.createdAt,
      },
      meta: {
        month: savedForecast.month,
        historicalMonths: savedForecast.basedOnMonths,
        predictionMethod: 'ensemble',
      },
    });
  } catch (error) {
    handleForecastError(error, res);
  }
}

async function getLatestForecast(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    logger.info('[forecastController] Fetching latest forecast', {
      userId: req.userId,
    });

    const forecast = await forecastService.getLatestForecast(req.userId);

    if (!forecast) {
      res.status(404).json({
        success: false,
        message: 'No forecast found. Generate one using POST /api/forecasts/generate',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        month: forecast.month,
        predictedAmount: forecast.predictedAmount,
        insight: forecast.insight,
        confidence: forecast.confidence || 50,
        trend: forecast.trend || 'stable',
        confidenceInterval: forecast.confidenceInterval || { lower: 0, upper: 0 },
        basedOnMonths: forecast.basedOnMonths,
        createdAt: forecast.createdAt,
      },
      meta: {
        month: forecast.month,
        historicalMonths: forecast.basedOnMonths,
      },
    });
  } catch (error) {
    handleForecastError(error, res);
  }
}

async function getForecastByMonth(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new AppError(400, 'Month must be in YYYY-MM format');
    }

    logger.info('[forecastController] Fetching forecast by month', {
      userId: req.userId,
      month,
    });

    const forecast = await forecastService.getForecast(req.userId, month);

    if (!forecast) {
      res.status(404).json({
        success: false,
        message: `No forecast found for month ${month}`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        month: forecast.month,
        predictedAmount: forecast.predictedAmount,
        insight: forecast.insight,
        basedOnMonths: forecast.basedOnMonths,
        createdAt: forecast.createdAt,
      },
      meta: {
        month: forecast.month,
        historicalMonths: forecast.basedOnMonths,
      },
    });
  } catch (error) {
    handleForecastError(error, res);
  }
}

async function getAllForecasts(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    let limit = 12;
    if (req.query.limit) {
      const parsed = parseInt(req.query.limit);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
        limit = parsed;
      }
    }

    logger.info('[forecastController] Fetching all forecasts', {
      userId: req.userId,
      limit,
    });

    const forecasts = await forecastService.getAllForecasts(req.userId, limit);

    const formattedForecasts = forecasts.map((f) => ({
      month: f.month,
      predictedAmount: f.predictedAmount,
      insight: f.insight,
      basedOnMonths: f.basedOnMonths,
      createdAt: f.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: formattedForecasts,
      meta: {
        count: forecasts.length,
        limit,
      },
    });
  } catch (error) {
    handleForecastError(error, res);
  }
}

async function getForecastBreakdown(req, res) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new AppError(400, 'Month must be in YYYY-MM format');
    }

    logger.info('[forecastController] Fetching forecast breakdown', {
      userId: req.userId,
      month,
    });

    const forecast = await forecastService.getForecast(req.userId, month);

    if (!forecast) {
      res.status(404).json({
        success: false,
        message: `No forecast found for month ${month}`,
      });
      return;
    }

    const monthlyData = await forecastService.aggregateMonthlyExpenses(
      req.userId,
      forecast.basedOnMonths
    );

    const totals = monthlyData.map((m) => m.total);
    const averageMonthly =
      totals.reduce((a, b) => a + b, 0) / totals.length;

    const allCategories = new Set();
    monthlyData.forEach((m) => {
      Object.keys(m.categories).forEach((cat) => allCategories.add(cat));
    });

    res.status(200).json({
      success: true,
      data: {
        forecast: {
          month: forecast.month,
          predictedAmount: forecast.predictedAmount,
          insight: forecast.insight,
        },
        analysis: {
          basedOnMonths: forecast.basedOnMonths,
          historicalData: monthlyData,
          statistics: {
            averageMonthly: Math.round(averageMonthly * 100) / 100,
            highestMonth: Math.max(...totals),
            lowestMonth: Math.min(...totals),
            totalCategories: allCategories.size,
          },
          highRiskCategories: monthlyData[monthlyData.length - 1]?.categories
            ? Object.entries(monthlyData[monthlyData.length - 1].categories)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => ({
                category,
                recentSpend: amount,
              }))
            : [],
        },
      },
      meta: {
        month: forecast.month,
        historicalMonths: forecast.basedOnMonths,
      },
    });
  } catch (error) {
    handleForecastError(error, res);
  }
}

function handleForecastError(error, res) {
  if (error instanceof AppError) {
    logger.warn('[forecastController] AppError:', {
      statusCode: error.statusCode,
      message: error.message,
    });
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  } else {
    logger.error('[forecastController] Unexpected error:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Internal server error while processing forecast',
    });
  }
}

module.exports = {
  generateForecast,
  getLatestForecast,
  getForecastByMonth,
  getAllForecasts,
  getForecastBreakdown,
};
