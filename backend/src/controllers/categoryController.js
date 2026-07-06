const categoryService = require('../services/categoryService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function getCategories(req, res, next) {
  try {
    const { type } = req.query;

    if (type && !['income', 'expense'].includes(type)) {
      throw new AppError(400, 'Type must be either "income" or "expense"');
    }

    const categories = await categoryService.getCategories(req.userId, type);

    res.status(200).json({
      success: true,
      data: categories,
      meta: { count: categories.length, type: type || 'all' },
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, type } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, 'Category name is required');
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      throw new AppError(400, 'Category name must be between 2 and 50 characters');
    }
    if (!type || !['income', 'expense'].includes(type)) {
      throw new AppError(400, 'Type must be either "income" or "expense"');
    }

    const category = await categoryService.createCategory(req.userId, name.trim(), type);

    logger.info('[categoryController] Created category', { userId: req.userId, name: category.name });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await categoryService.deleteCategory(req.userId, req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
