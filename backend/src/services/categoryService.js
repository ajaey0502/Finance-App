const Category = require('../models/Category');
const { AppError } = require('../middleware/errorHandler');

const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Subscription',
  'Rent',
  'Education',
  'Other',
  'Miscellaneous',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Bonus',
  'Gift',
  'Other',
];

async function initializeDefaultCategories(userId) {
  // Check if categories already exist
  const existingCount = await Category.countDocuments({ userId });
  if (existingCount > 0) return;

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
    userId,
    name,
    type: 'expense',
    isCustom: false,
  }));

  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((name) => ({
    userId,
    name,
    type: 'income',
    isCustom: false,
  }));

  await Category.insertMany([...expenseCategories, ...incomeCategories]);
}

async function getCategories(userId, type) {
  const query = { userId };
  if (type) query.type = type;

  return Category.find(query).sort({ isCustom: 1, name: 1 });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function createCategory(userId, name, type) {
  const existingCategory = await Category.findOne({
    userId,
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    type,
  });

  if (existingCategory) {
    throw new AppError(400, 'Category already exists');
  }

  const category = new Category({
    userId,
    name,
    type,
    isCustom: true,
  });

  return category.save();
}

async function deleteCategory(userId, categoryId) {
  const category = await Category.findOne({ _id: categoryId, userId });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  if (!category.isCustom) {
    throw new AppError(400, 'Cannot delete default categories');
  }

  await Category.deleteOne({ _id: categoryId, userId });
}

module.exports = {
  initializeDefaultCategories,
  getCategories,
  createCategory,
  deleteCategory,
};
