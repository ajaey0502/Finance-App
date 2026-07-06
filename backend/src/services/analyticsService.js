const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

function getDateRange(months) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  return { startDate, endDate };
}

function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month - 1] || 'Unknown';
}

async function getMonthlySummary(userId, months = 6, year = null, month = null) {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    let matchStage = { userId: objectId };

    if (year && month) {
      // Filter for specific month with correct date range
      const startDate = new Date(year, month - 1, 1); // 1st of month
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
      matchStage.date = { $gte: startDate, $lte: endDate };
    } else {
      // Filter for last N months
      const { startDate } = getDateRange(months);
      matchStage.date = { $gte: startDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          totalIncome: { $round: ['$totalIncome', 2] },
          totalExpenses: { $round: ['$totalExpenses', 2] },
          balance: {
            $round: [
              { $subtract: ['$totalIncome', '$totalExpenses'] },
              2,
            ],
          },
          transactionCount: '$count',
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ];

    const results = await Transaction.aggregate(pipeline);

    return results.map((item) => ({
      ...item,
      monthName: getMonthName(item.month),
    }));
  } catch (error) {
    logger.error('[analyticsService] Error in getMonthlySummary:', error);
    throw error;
  }
}

async function getCategoryBreakdown(userId, months = 1, type = 'expense', year = null, month = null) {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    let matchStage = { userId: objectId, type };

    if (year && month) {
      const startDate = new Date(year, month - 1, 1); // 1st of month
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
      matchStage.date = { $gte: startDate, $lte: endDate };
    } else {
      const { startDate } = getDateRange(months);
      matchStage.date = { $gte: startDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                grandTotal: { $sum: '$totalAmount' },
              },
            },
          ],
          categories: [
            {
              $project: {
                category: '$_id',
                amount: { $round: ['$totalAmount', 2] },
                count: 1,
                avgTransaction: {
                  $round: [{ $divide: ['$totalAmount', '$count'] }, 2],
                },
                _id: 0,
              },
            },
          ],
        },
      },
      {
        $project: {
          categories: {
            $map: {
              input: '$categories',
              as: 'cat',
              in: {
                $mergeObjects: [
                  '$$cat',
                  {
                    percentage: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ['$$cat.amount', { $arrayElemAt: ['$totals.grandTotal', 0] }] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $unwind: '$categories',
      },
      {
        $replaceRoot: { newRoot: '$categories' },
      },
      {
        $sort: { amount: -1 },
      },
    ];

    return await Transaction.aggregate(pipeline);
  } catch (error) {
    logger.error('[analyticsService] Error in getCategoryBreakdown:', error);
    throw error;
  }
}

async function getIncomeExpenseComparison(userId, months = 3) {
  try {
    const { startDate } = getDateRange(months);
    const objectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: objectId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $project: {
          period: {
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
          income: { $round: ['$income', 2] },
          expenses: { $round: ['$expenses', 2] },
          balance: {
            $round: [{ $subtract: ['$income', '$expenses'] }, 2],
          },
          total: { $add: ['$income', '$expenses'] },
          _id: 0,
        },
      },
      {
        $project: {
          period: 1,
          income: 1,
          expenses: 1,
          balance: 1,
          incomePercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$income', '$total'] },
                  100,
                ],
              },
              2,
            ],
          },
          expensePercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$expenses', '$total'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      {
        $sort: { period: 1 },
      },
    ];

    return await Transaction.aggregate(pipeline);
  } catch (error) {
    logger.error('[analyticsService] Error in getIncomeExpenseComparison:', error);
    throw error;
  }
}

async function getMonthOverMonthComparison(userId, months = 6) {
  try {
    const { startDate } = getDateRange(months);
    const objectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: objectId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
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
          income: { $round: ['$income', 2] },
          expenses: { $round: ['$expenses', 2] },
          balance: {
            $round: [{ $subtract: ['$income', '$expenses'] }, 2],
          },
          _id: 0,
        },
      },
    ];

    const monthlyData = await Transaction.aggregate(pipeline);

    return monthlyData.map((current, index) => {
      const previous = index > 0 ? monthlyData[index - 1] : null;

      const incomeChange = previous ? current.income - previous.income : 0;
      const incomeChangePercent = previous && previous.income !== 0
        ? ((incomeChange / previous.income) * 100)
        : 0;

      const expenseChange = previous ? current.expenses - previous.expenses : 0;
      const expenseChangePercent = previous && previous.expenses !== 0
        ? ((expenseChange / previous.expenses) * 100)
        : 0;

      return {
        month: current.month,
        income: current.income,
        expenses: current.expenses,
        balance: current.balance,
        incomeChange: Math.round(incomeChange * 100) / 100,
        incomeChangePercent: Math.round(incomeChangePercent * 100) / 100,
        expenseChange: Math.round(expenseChange * 100) / 100,
        expenseChangePercent: Math.round(expenseChangePercent * 100) / 100,
      };
    });
  } catch (error) {
    logger.error('[analyticsService] Error in getMonthOverMonthComparison:', error);
    throw error;
  }
}

async function getDailyTrends(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const objectId = new mongoose.Types.ObjectId(userId);

    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const pipeline = [
      {
        $match: {
          userId: objectId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          date: '$_id',
          income: { $round: ['$income', 2] },
          expenses: { $round: ['$expenses', 2] },
          balance: {
            $round: [{ $subtract: ['$income', '$expenses'] }, 2],
          },
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ];

    const results = await Transaction.aggregate(pipeline);

    return results.map((item) => {
      const date = new Date(item.date);
      return {
        ...item,
        dayOfWeek: weekDays[date.getDay()],
      };
    });
  } catch (error) {
    logger.error('[analyticsService] Error in getDailyTrends:', error);
    throw error;
  }
}

async function getTopCategories(userId, limit = 5, months = 1, type = 'expense') {
  try {
    const { startDate } = getDateRange(months);
    const objectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: objectId,
          date: { $gte: startDate },
          type,
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
      {
        $limit: limit,
      },
      {
        $facet: {
          topCategories: [
            {
              $project: {
                category: '$_id',
                amount: { $round: ['$totalAmount', 2] },
                count: 1,
                _id: 0,
              },
            },
          ],
          total: [
            {
              $group: {
                _id: null,
                grandTotal: { $sum: '$totalAmount' },
              },
            },
          ],
        },
      },
      {
        $project: {
          topCategories: {
            $map: {
              input: '$topCategories',
              as: 'cat',
              in: {
                $mergeObjects: [
                  '$$cat',
                  {
                    percentage: {
                      $round: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                '$$cat.amount',
                                { $arrayElemAt: ['$total.grandTotal', 0] },
                              ],
                            },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $unwind: '$topCategories' },
      { $replaceRoot: { newRoot: '$topCategories' } },
    ];

    const results = await Transaction.aggregate(pipeline);

    return results.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  } catch (error) {
    logger.error('[analyticsService] Error in getTopCategories:', error);
    throw error;
  }
}

async function getSummaryStatistics(userId, months = 1, year = null, month = null) {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    let matchStage = { userId: objectId };

    if (year && month) {
      const startDate = new Date(year, month - 1, 1); // 1st of month
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
      matchStage.date = { $gte: startDate, $lte: endDate };
    } else {
      const { startDate } = getDateRange(months);
      matchStage.date = { $gte: startDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          incomeCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, 1, 0],
            },
          },
          expenseCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, 1, 0],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          totalIncome: { $round: ['$totalIncome', 2] },
          totalExpenses: { $round: ['$totalExpenses', 2] },
          balance: {
            $round: [{ $subtract: ['$totalIncome', '$totalExpenses'] }, 2],
          },
          incomeCount: 1,
          expenseCount: 1,
          totalTransactions: '$totalCount',
          avgIncomeTransaction: {
            $round: [
              {
                $cond: [
                  { $gt: ['$incomeCount', 0] },
                  { $divide: ['$totalIncome', '$incomeCount'] },
                  0,
                ],
              },
              2,
            ],
          },
          avgExpenseTransaction: {
            $round: [
              {
                $cond: [
                  { $gt: ['$expenseCount', 0] },
                  { $divide: ['$totalExpenses', '$expenseCount'] },
                  0,
                ],
              },
              2,
            ],
          },
          _id: 0,
        },
      },
    ];

    const result = await Transaction.aggregate(pipeline);
    return result[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalTransactions: 0,
      avgIncomeTransaction: 0,
      avgExpenseTransaction: 0,
    };
  } catch (error) {
    logger.error('[analyticsService] Error in getSummaryStatistics:', error);
    throw error;
  }
}

module.exports = {
  getMonthlySummary,
  getCategoryBreakdown,
  getIncomeExpenseComparison,
  getMonthOverMonthComparison,
  getDailyTrends,
  getTopCategories,
  getSummaryStatistics,
};
