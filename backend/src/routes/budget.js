const express = require('express');
const { authenticate, AuthenticatedRequest } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const budgetController = require('../controllers/budgetController');

const router = express.Router();

router.use(authenticate);

router.post('/', asyncHandler(async (req, res) => {
  await budgetController.createBudget(req, res);
}));

router.get('/', asyncHandler(async (req, res) => {
  await budgetController.getBudgets(req, res);
}));

router.get('/usage/all', asyncHandler(async (req, res) => {
  await budgetController.getAllBudgetsWithUsage(req, res);
}));

router.get('/alerts/check', asyncHandler(async (req, res) => {
  await budgetController.getBudgetAlerts(req, res);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  await budgetController.getBudgetById(req, res);
}));

router.get('/:id/usage', asyncHandler(async (req, res) => {
  await budgetController.getBudgetUsage(req, res);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  await budgetController.updateBudget(req, res);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await budgetController.deleteBudget(req, res);
}));

module.exports = router;
