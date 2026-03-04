const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const AICache = require('../models/AICache');
const logger = require('../utils/logger');
const { matchByKeywords, isNonsensical } = require('./categoryMatcher');

const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

const VALID_CATEGORIES = [
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
  'Miscellaneous'
];

/**
 * Categorize expense with fallback chain: keywords -> cache -> AI -> miscellaneous
 */
async function categorizeExpense(userId, description) {
  // Step 0: Check if nonsensical
  if (isNonsensical(description)) {
    logger.info(`Nonsensical description detected: "${description}" -> Miscellaneous`);
    return {
      category: 'Miscellaneous',
      confidence: 1.0,
      source: 'validation'
    };
  }

  // Step 1: Try keyword matching (instant, free, high confidence)
  const keywordMatch = matchByKeywords(description);
  if (keywordMatch) {
    return keywordMatch;
  }

  // Step 2: Check cache
  const cached = await AICache.findOne({
    userId,
    description: new RegExp(`^${escapeRegex(description)}$`, 'i'),
  });

  if (cached) {
    logger.debug('Found cached AI result:', { 
      description, 
      category: cached.suggestedCategory 
    });
    return {
      category: cached.suggestedCategory,
      confidence: cached.confidence,
      source: 'cache'
    };
  }

  // Step 3: Call AI (expensive, last resort before fallback)
  try {
    const aiResult = await categorizeWithGemini(description);
    
    // Validate AI result
    if (!aiResult.category || !VALID_CATEGORIES.includes(aiResult.category)) {
      logger.warn(`AI returned invalid category: ${aiResult.category}, using Miscellaneous`);
      aiResult.category = 'Miscellaneous';
      aiResult.confidence = 0.5;
    }
    
    // If AI has very low confidence, use Miscellaneous
    if (aiResult.confidence < 0.3) {
      logger.info(`Low AI confidence (${aiResult.confidence}) for "${description}", using Miscellaneous`);
      aiResult.category = 'Miscellaneous';
      aiResult.confidence = 0.5;
    }
    
    // Cache the result
    await cacheAIResult(userId, description, aiResult.category, aiResult.confidence);
    
    return {
      ...aiResult,
      source: 'ai'
    };
  } catch (error) {
    logger.error('AI categorization failed:', error);
    
    // Step 4: Final fallback - Miscellaneous
    return {
      category: 'Miscellaneous',
      confidence: 0.5,
      source: 'fallback'
    };
  }
}

/**
 * Categorize using Gemini AI
 */
async function categorizeWithGemini(description) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Categorize this expense description into ONE of these categories ONLY: ${VALID_CATEGORIES.join(', ')}.

Description: "${description}"

Rules:
- Choose the MOST appropriate category
- If unsure or the description is unclear, use "Miscellaneous"
- Return ONLY valid JSON, nothing else

Required JSON format:
{"category": "CategoryName", "confidence": 0.85}

Response:`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || 'Miscellaneous',
        confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
      };
    }

    return { category: 'Miscellaneous', confidence: 0.5 };
  } catch (error) {
    logger.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Cache AI categorization result
 */
async function cacheAIResult(userId, description, category, confidence) {
  try {
    const cache = new AICache({
      userId,
      description,
      suggestedCategory: category,
      confidence,
    });
    await cache.save();
    logger.debug(`Cached AI result: ${description} -> ${category}`);
  } catch (error) {
    // Don't fail if caching fails
    logger.error('Failed to cache AI result:', error);
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function generateMonthlyForecast(userId, months = 3) {
  try {
    const Transaction = (await import('../models/Transaction')).default;

    // Get last N months of transactions
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: startDate },
    });

    if (transactions.length === 0) {
      return {
        predictedSpend: 0,
        explanation: 'Not enough transaction history for forecasting.',
      };
    }

    // Calculate monthly average
    const monthlyTotals = {};
    transactions.forEach((t) => {
      const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + t.amount;
    });

    const monthlyAverages = Object.values(monthlyTotals);
    const avgSpend = monthlyAverages.reduce((a, b) => a + b, 0) / monthlyAverages.length;

    // Create summary for Gemini
    const transactionSummary = transactions
      .slice(0, 20)
      .map((t) => `${t.category}: $${t.amount}`)
      .join(', ');

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on this spending history:
Average monthly spend: $${avgSpend.toFixed(2)}
Recent transactions: ${transactionSummary}

Provide a brief prediction for next month's spending (return JSON only):
{"predictedSpend": <number>, "explanation": "<string>"}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        predictedSpend: parsed.predictedSpend || avgSpend,
        explanation: parsed.explanation || `Based on historical data, expected monthly spending is around $${avgSpend.toFixed(2)}.`,
      };
    }

    return {
      predictedSpend: avgSpend,
      explanation: `Based on the last ${months} months, your average monthly spending is $${avgSpend.toFixed(2)}.`,
    };
  } catch (error) {
    logger.error('Forecast generation failed:', error);
    return {
      predictedSpend: 0,
      explanation: 'Unable to generate forecast at this time.',
    };
  }
}

module.exports = {
  categorizeExpense,
  generateMonthlyForecast,
};
