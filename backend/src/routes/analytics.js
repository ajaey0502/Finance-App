const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/monthly-summary', analyticsController.getMonthlySummary);
router.get('/category-breakdown', analyticsController.getCategoryBreakdown);
router.get('/income-expense', analyticsController.getIncomeExpense);
router.get('/month-over-month', analyticsController.getMonthOverMonth);
router.get('/daily-trends', analyticsController.getDailyTrends);
router.get('/top-categories', analyticsController.getTopCategories);
router.get('/summary', analyticsController.getSummaryStatistics);
router.get('/alerts', analyticsController.getBudgetAlerts);

// Legacy endpoints
router.get('/', analyticsController.getDashboard);
router.get('/categories', analyticsController.getCategoryBreakdown);
router.get('/monthly-comparison', analyticsController.getMonthOverMonth);

module.exports = router;
