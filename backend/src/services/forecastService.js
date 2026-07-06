const Transaction = require('../models/Transaction');
const Forecast = require('../models/Forecast');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// ============================================
// STATISTICAL UTILITY FUNCTIONS
// ============================================

/**
 * Calculate Exponential Moving Average (EMA)
 * Gives more weight to recent data points
 * @param {number[]} data - Array of values (oldest to newest)
 * @param {number} alpha - Smoothing factor (0-1), higher = more weight on recent
 */
function exponentialMovingAverage(data, alpha = 0.3) {
  if (!data || data.length === 0) return 0;
  if (data.length === 1) return data[0];

  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = alpha * data[i] + (1 - alpha) * ema;
  }
  return Math.round(ema * 100) / 100;
}

/**
 * Calculate statistical metrics for confidence intervals
 * @param {number[]} data - Array of values
 */
function calculateStatistics(data) {
  if (!data || data.length === 0) {
    return { mean: 0, stdDev: 0, variance: 0, min: 0, max: 0 };
  }

  const n = data.length;
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    min: Math.min(...data),
    max: Math.max(...data),
  };
}

/**
 * Calculate 95% confidence interval
 * @param {number} mean - Mean value
 * @param {number} stdDev - Standard deviation
 * @param {number} n - Sample size
 */
function confidenceInterval(mean, stdDev, n) {
  // Z-score for 95% confidence = 1.96
  const zScore = 1.96;
  const marginOfError = zScore * (stdDev / Math.sqrt(n || 1));

  return {
    lower: Math.max(0, Math.round((mean - marginOfError) * 100) / 100),
    upper: Math.round((mean + marginOfError) * 100) / 100,
    marginOfError: Math.round(marginOfError * 100) / 100,
  };
}

/**
 * Calculate confidence score (0-100%) based on data consistency
 * @param {number[]} data - Historical data points
 */
function calculateConfidenceScore(data) {
  if (!data || data.length < 2) return 50; // Low confidence with insufficient data

  const stats = calculateStatistics(data);
  if (stats.mean === 0) return 50;

  // Coefficient of Variation (CV) - lower is more consistent
  const cv = stats.stdDev / stats.mean;

  // Convert CV to confidence score (inverse relationship)
  // CV of 0 = 100% confidence, CV of 1+ = 50% confidence
  const confidence = Math.max(50, Math.min(100, 100 - (cv * 50)));

  return Math.round(confidence);
}

/**
 * Linear regression for trend analysis
 * @param {number[]} data - Array of values (oldest to newest)
 * @returns {object} - slope, intercept, and next predicted value
 */
function linearRegression(data) {
  if (!data || data.length < 2) {
    return { slope: 0, intercept: data?.[0] || 0, nextValue: data?.[0] || 0, trend: 'stable' };
  }

  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const nextValue = Math.max(0, slope * n + intercept);

  // Determine trend direction
  let trend = 'stable';
  const percentChange = (slope / (sumY / n)) * 100;
  if (percentChange > 5) trend = 'increasing';
  else if (percentChange < -5) trend = 'decreasing';

  return {
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
    nextValue: Math.round(nextValue * 100) / 100,
    trend,
    percentChange: Math.round(percentChange * 100) / 100,
  };
}

// ============================================
// ADVANCED FORECASTING FUNCTIONS
// ============================================

/**
 * Enhanced forecasting with multiple models
 * Combines: EMA, Linear Regression, and Current Pacing
 */
function advancedForecastSpending({ months, currentSpend, daysPassed, totalDays }) {
  const hasHistory = Array.isArray(months) && months.length > 0;

  if (!hasHistory) {
    const pacing = daysPassed > 0 ? (currentSpend / daysPassed) * totalDays : 0;
    return {
      predicted: Math.round(pacing * 100) / 100,
      method: 'pacing',
      confidence: 50,
      breakdown: { pacing },
    };
  }

  // 1. Simple Average
  const simpleAvg = months.reduce((sum, val) => sum + val, 0) / months.length;

  // 2. Exponential Moving Average (more weight on recent)
  const ema = exponentialMovingAverage(months, 0.4);

  // 3. Linear Regression Trend
  const regression = linearRegression(months);

  // 4. Current Month Pacing Projection
  const pacingProjection = daysPassed > 0 
    ? (currentSpend / daysPassed) * totalDays 
    : simpleAvg;

  // 5. Weighted ensemble prediction
  // - 30% current pacing (most recent behavior)
  // - 30% EMA (smoothed recent trend)
  // - 25% linear regression (trend direction)
  // - 15% simple average (baseline)
  const weighted = (
    pacingProjection * 0.30 +
    ema * 0.30 +
    regression.nextValue * 0.25 +
    simpleAvg * 0.15
  );

  // Calculate confidence based on historical consistency
  const confidence = calculateConfidenceScore(months);

  // Calculate confidence interval
  const stats = calculateStatistics(months);
  const interval = confidenceInterval(weighted, stats.stdDev, months.length);

  return {
    predicted: Math.max(0, Math.round(weighted * 100) / 100),
    method: 'ensemble',
    confidence,
    trend: regression.trend,
    breakdown: {
      simpleAverage: Math.round(simpleAvg * 100) / 100,
      ema: ema,
      linearRegression: regression.nextValue,
      pacing: Math.round(pacingProjection * 100) / 100,
    },
    confidenceInterval: interval,
    statistics: stats,
  };
}

/**
 * Aggregate past months by category for granular forecasting
 */
async function aggregatePastMonthsByCategory(userId, months = 3) {
  try {
    const clampedMonths = Math.min(Math.max(months, 3), 6);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - clampedMonths);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentMonthStart);
    endDate.setMilliseconds(-1);

    const objectId = new mongoose.Types.ObjectId(userId);

    const categoryData = await Transaction.aggregate([
      {
        $match: {
          userId: objectId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            category: '$category',
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          monthlyData: {
            $push: {
              month: {
                $concat: [
                  { $toString: '$_id.year' },
                  '-',
                  {
                    $cond: [
                      { $lt: ['$_id.month', 10] },
                      { $concat: ['0', { $toString: '$_id.month' }] },
                      { $toString: '$_id.month' },
                    ],
                  },
                ],
              },
              total: '$total',
              count: '$count',
            },
          },
          avgMonthly: { $avg: '$total' },
          totalSpent: { $sum: '$total' },
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
    ]);

    logger.info('[forecastService] Aggregated past months by category', {
      userId,
      months: clampedMonths,
      categories: categoryData.length,
    });

    return categoryData.map((cat) => ({
      category: cat._id,
      monthlyData: cat.monthlyData.sort((a, b) => a.month.localeCompare(b.month)),
      avgMonthly: Math.round(cat.avgMonthly * 100) / 100,
      totalSpent: Math.round(cat.totalSpent * 100) / 100,
    }));
  } catch (error) {
    logger.error('[forecastService] Error aggregating by category:', error);
    throw error;
  }
}

/**
 * Generate category-level forecast
 */
async function generateCategoryForecast(userId, months = 3) {
  try {
    const categoryHistory = await aggregatePastMonthsByCategory(userId, months);
    const currentMonthData = await getCurrentMonthActual(userId);

    const categoryForecasts = categoryHistory.map((cat) => {
      const monthlyTotals = cat.monthlyData.map((m) => m.total);
      const forecast = advancedForecastSpending({
        months: monthlyTotals,
        currentSpend: 0, // We don't have per-category current spend easily
        daysPassed: currentMonthData.dayOfMonth,
        totalDays: currentMonthData.daysInMonth,
      });

      return {
        category: cat.category,
        predicted: forecast.predicted,
        confidence: forecast.confidence,
        trend: forecast.trend,
        avgMonthly: cat.avgMonthly,
        confidenceInterval: forecast.confidenceInterval,
      };
    });

    // Sort by predicted amount descending
    categoryForecasts.sort((a, b) => b.predicted - a.predicted);

    // Calculate total from category forecasts
    const totalFromCategories = categoryForecasts.reduce((sum, cat) => sum + cat.predicted, 0);

    return {
      categories: categoryForecasts,
      totalPredicted: Math.round(totalFromCategories * 100) / 100,
      categoryCount: categoryForecasts.length,
    };
  } catch (error) {
    logger.error('[forecastService] Error generating category forecast:', error);
    throw error;
  }
}

/**
 * Aggregate past months with a per-category breakdown for each month.
 * Used by the forecast breakdown endpoint to show historical category risk.
 */
async function aggregateMonthlyExpenses(userId, months = 3) {
  try {
    const clampedMonths = Math.min(Math.max(months, 3), 6);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - clampedMonths);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentMonthStart);
    endDate.setMilliseconds(-1);

    const objectId = new mongoose.Types.ObjectId(userId);

    const rows = await Transaction.aggregate([
      {
        $match: {
          userId: objectId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            month: {
              $concat: [
                { $toString: { $year: '$date' } },
                '-',
                {
                  $cond: [
                    { $lt: [{ $month: '$date' }, 10] },
                    { $concat: ['0', { $toString: { $month: '$date' } }] },
                    { $toString: { $month: '$date' } },
                  ],
                },
              ],
            },
            category: '$category',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const byMonth = new Map();
    for (const row of rows) {
      const { month, category } = row._id;
      if (!byMonth.has(month)) {
        byMonth.set(month, { month, total: 0, categories: {} });
      }
      const entry = byMonth.get(month);
      entry.total += row.total;
      entry.categories[category] = Math.round(row.total * 100) / 100;
    }

    return Array.from(byMonth.values())
      .map((entry) => ({ ...entry, total: Math.round(entry.total * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    logger.error('[forecastService] Error aggregating monthly expenses:', error);
    throw error;
  }
}

// ============================================
// ORIGINAL FUNCTIONS (PRESERVED)
// ============================================

// Simple deterministic forecaster (kept for backward compatibility)
function forecastSpending({ months, currentSpend, daysPassed, totalDays }) {
  const hasHistory = Array.isArray(months) && months.length > 0;
  const averageHistory = hasHistory
    ? months.reduce((sum, val) => sum + val, 0) / months.length
    : 0;

  const pacingProjection = daysPassed > 0
    ? (currentSpend / daysPassed) * totalDays
    : averageHistory;

  const weighted = hasHistory
    ? (pacingProjection * 0.6 + averageHistory * 0.4)
    : pacingProjection;

  return Math.max(0, Math.round(weighted * 100) / 100);
}

/**
 * Aggregate completed past months (excluding current month)
 */
async function aggregatePastMonths(userId, months = 3) {
  try {
    if (months < 3 || months > 6) {
      months = Math.min(Math.max(months, 3), 6);
      logger.warn('[forecastService] Months out of range, clamped to 3-6', {
        userId,
        requested: months,
        adjusted: months,
      });
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentMonthStart);
    endDate.setMilliseconds(-1);

    const objectId = new mongoose.Types.ObjectId(userId);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: objectId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const result = monthlyData.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: Math.round(item.total * 100) / 100,
      transactionCount: item.count,
    }));

    logger.info('[forecastService] Aggregated past months', {
      userId,
      months,
      dataPoints: result.length,
      startMonth: result[0]?.month,
      endMonth: result[result.length - 1]?.month,
    });

    return result;
  } catch (error) {
    logger.error('[forecastService] Error aggregating past months:', error);
    throw error;
  }
}

/**
 * Get current month actual spending to date
 */
async function getCurrentMonthActual(userId) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const objectId = new mongoose.Types.ObjectId(userId);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: objectId,
          type: 'expense',
          date: { $gte: monthStart, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const currentSpending = result[0]?.total || 0;
    const transactionCount = result[0]?.count || 0;
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    logger.info('[forecastService] Current month actual retrieved', {
      userId,
      currentSpending: Math.round(currentSpending * 100) / 100,
      dayOfMonth,
      daysInMonth,
    });

    return {
      currentSpending: Math.round(currentSpending * 100) / 100,
      transactionCount,
      dayOfMonth,
      daysInMonth,
    };
  } catch (error) {
    logger.error('[forecastService] Error getting current month actual:', error);
    throw error;
  }
}

/**
 * ENHANCED: Main forecast generation with advanced statistical modeling
 */
async function generateForecast(userId, months = 3) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('[forecastService] Invalid user ID', { userId });
      throw new Error('Invalid user ID format');
    }

    months = Math.min(Math.max(months, 3), 6);

    logger.info('[forecastService] Starting advanced forecast generation', {
      userId,
      historicalMonths: months,
    });

    const pastMonths = await aggregatePastMonths(userId, months);
    const currentMonthData = await getCurrentMonthActual(userId);

    if (pastMonths.length === 0) {
      logger.warn('[forecastService] No expense data available for forecast', {
        userId,
        months,
      });
      return {
        month: getCurrentMonthString(),
        predictedAmount: 0,
        currentSpending: 0,
        confidence: 50,
        explanation: 'Insufficient expense history. Create some transactions to get a forecast.',
        basedOnMonths: 0,
        trend: 'stable',
        confidenceInterval: { lower: 0, upper: 0 },
      };
    }

    // Use advanced forecasting with ensemble method
    const monthlyTotals = pastMonths.map((m) => m.total);
    const advancedResult = advancedForecastSpending({
      months: monthlyTotals,
      currentSpend: currentMonthData.currentSpending,
      daysPassed: currentMonthData.dayOfMonth,
      totalDays: currentMonthData.daysInMonth,
    });

    // Generate category breakdown
    const categoryForecast = await generateCategoryForecast(userId, months);

    // Generate dynamic explanation
    const explanation = generateExplanation(advancedResult, categoryForecast);

    const result = {
      month: getCurrentMonthString(),
      predictedAmount: advancedResult.predicted,
      currentSpending: currentMonthData.currentSpending,
      confidence: advancedResult.confidence,
      trend: advancedResult.trend,
      explanation,
      basedOnMonths: pastMonths.length,
      confidenceInterval: advancedResult.confidenceInterval,
      breakdown: advancedResult.breakdown,
      topCategories: categoryForecast.categories.slice(0, 5),
    };

    logger.info('[forecastService] Advanced forecast generated', {
      userId,
      month: result.month,
      predictedAmount: result.predictedAmount,
      confidence: result.confidence,
      trend: result.trend,
    });

    return result;
  } catch (error) {
    logger.error('[forecastService] Error generating forecast:', error);
    throw error;
  }
}

/**
 * Generate human-readable explanation for the forecast
 */
function generateExplanation(forecast, categoryForecast) {
  const trendText = {
    increasing: 'Your spending has been trending upward.',
    decreasing: 'Your spending has been trending downward.',
    stable: 'Your spending has been relatively stable.',
  };

  const confidenceText = forecast.confidence >= 80
    ? 'High confidence prediction'
    : forecast.confidence >= 60
    ? 'Moderate confidence prediction'
    : 'Limited data - prediction may vary';

  const topCategory = categoryForecast.categories[0];
  const categoryNote = topCategory
    ? ` Top spending category: ${topCategory.category} (~$${topCategory.predicted}).`
    : '';

  return `${confidenceText} based on ${forecast.breakdown ? 'ensemble modeling' : 'historical average'}. ${trendText[forecast.trend] || ''}${categoryNote}`;
}

/**
 * Save forecast to database
 */
async function saveForecast(userId, forecast) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('[forecastService] Invalid user ID for saving forecast', {
        userId,
      });
      throw new Error('Invalid user ID format');
    }

    const existing = await Forecast.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      month: forecast.month,
    });

    if (existing) {
      logger.info('[forecastService] Forecast already exists, updating', {
        userId,
        month: forecast.month,
      });
      Object.assign(existing, {
        predictedAmount: forecast.predictedAmount,
        insight: forecast.explanation,
        confidence: forecast.confidence,
        basedOnMonths: forecast.basedOnMonths,
      });
      return existing.save();
    }

    const newForecast = new Forecast({
      userId: new mongoose.Types.ObjectId(userId),
      month: forecast.month,
      predictedAmount: forecast.predictedAmount,
      insight: forecast.explanation,
      confidence: forecast.confidence,
      basedOnMonths: forecast.basedOnMonths,
    });

    const saved = await newForecast.save();

    logger.info('[forecastService] Forecast saved', {
      userId,
      month: forecast.month,
      forecastId: saved._id,
    });

    return saved;
  } catch (error) {
    logger.error('[forecastService] Error saving forecast:', error);
    throw error;
  }
}

async function getForecast(userId, month) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('[forecastService] Invalid user ID', { userId });
      throw new Error('Invalid user ID format');
    }

    const forecast = await Forecast.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      month,
    });

    return forecast;
  } catch (error) {
    logger.error('[forecastService] Error fetching forecast:', error);
    throw error;
  }
}

async function getLatestForecast(userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('[forecastService] Invalid user ID', { userId });
      throw new Error('Invalid user ID format');
    }

    const forecast = await Forecast.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    return forecast;
  } catch (error) {
    logger.error('[forecastService] Error fetching latest forecast:', error);
    throw error;
  }
}

async function getAllForecasts(userId, limit = 12) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn('[forecastService] Invalid user ID', { userId });
      throw new Error('Invalid user ID format');
    }

    const forecasts = await Forecast.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ month: -1 })
      .limit(limit);

    return forecasts;
  } catch (error) {
    logger.error('[forecastService] Error fetching all forecasts:', error);
    throw error;
  }
}

/**
 * Helper: Get current month in YYYY-MM format
 */
function getCurrentMonthString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
  // Statistical utilities (NEW)
  exponentialMovingAverage,
  calculateStatistics,
  confidenceInterval,
  calculateConfidenceScore,
  linearRegression,
  // Advanced forecasting (NEW)
  advancedForecastSpending,
  aggregatePastMonthsByCategory,
  aggregateMonthlyExpenses,
  generateCategoryForecast,
  // Original functions
  aggregatePastMonths,
  getCurrentMonthActual,
  forecastSpending,
  generateForecast,
  saveForecast,
  getForecast,
  getLatestForecast,
  getAllForecasts,
};
