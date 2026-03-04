const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * POST /api/ai/categorize
 * Get category suggestion for a description
 */
router.post('/categorize', authMiddleware, async (req, res, next) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({
        error: 'Description is required and must be a string'
      });
    }

    if (description.trim().length < 1) {
      return res.status(400).json({
        error: 'Description cannot be empty'
      });
    }

    const result = await aiService.categorizeExpense(
      req.userId,
      description.trim()
    );

    logger.info('Category suggestion:', {
      userId: req.userId,
      description: description.trim(),
      result
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in /categorize:', error);
    next(error);
  }
});

module.exports = router;
