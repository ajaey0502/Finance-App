const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Rent',
  'Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Other',
];

const GEMINI_TIMEOUT = 5000; // 5 seconds timeout

async function categorizeExpense(input) {
  const { description, amount } = input;

  if (!description || description.trim().length === 0) {
    logger.warn('Empty description provided to categorizeExpense');
    return {
      category: 'Other',
      confidence: 0,
      description,
    };
  }

  try {
    const result = await Promise.race([
      callGeminiAPI(description, amount),
      timeoutPromise(GEMINI_TIMEOUT),
    ]);

    // Check if confidence is below threshold
    if (result.confidence < 0.6) {
      logger.info('Confidence below threshold, using Other category', {
        description,
        category: result.category,
        confidence: result.confidence,
      });
      return {
        category: 'Other',
        confidence: 0,
        description,
      };
    }

    logger.info('Successfully categorized expense', {
      description,
      category: result.category,
      confidence: result.confidence,
      amount,
    });

    return result;
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.error('Gemini API request timeout', { description, timeout: GEMINI_TIMEOUT });
    } else {
      logger.error('Failed to categorize expense with Gemini', {
        description,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Fallback to 'Other' category on any error
    return {
      category: 'Other',
      confidence: 0,
      description,
    };
  }
}

async function callGeminiAPI(description, amount) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const amountInfo = amount ? `\nAmount: $${amount.toFixed(2)}` : '';

  const prompt = `Categorize this expense into one of the following categories:
Food, Travel, Shopping, Rent, Utilities, Entertainment, Health, Education, Other.

Description: "${description}"${amountInfo}

Respond with a JSON object containing:
{
  "category": "<one of the listed categories>",
  "confidence": <number between 0 and 1>
}

Only return valid JSON, no other text.`;

  try {
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();

    logger.debug('Gemini API response received', {
      description,
      responseLength: responseText.length,
    });

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('No JSON found in Gemini response', {
        description,
        response: responseText.substring(0, 200),
      });
      throw new Error('Invalid response format from Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!parsed.category || typeof parsed.confidence !== 'number') {
      logger.warn('Invalid JSON structure from Gemini', {
        description,
        parsed,
      });
      throw new Error('Invalid response structure from Gemini');
    }

    // Validate category is in allowed list
    const validCategory = EXPENSE_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'Other';

    // Clamp confidence between 0 and 1
    const confidence = Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1);

    return {
      category: validCategory,
      confidence,
      description,
    };
  } catch (error) {
    logger.error('Error parsing Gemini response', {
      description,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Request timeout after ${ms}ms`));
    }, ms);
  });
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

async function categorizeBatch(inputs) {
  logger.info('Starting batch categorization', { count: inputs.length });

  const results = await Promise.all(
    inputs.map((input) => categorizeExpense(input).catch((error) => {
      logger.error('Batch categorization item failed', { description: input.description, error });
      return {
        category: 'Other',
        confidence: 0,
        description: input.description,
      };
    }))
  );

  logger.info('Batch categorization completed', {
    total: inputs.length,
    successful: results.filter((r) => r.confidence > 0).length,
  });

  return results;
}

function isValidCategory(category) {
  return EXPENSE_CATEGORIES.includes(category);
}

function getValidCategories() {
  return [...EXPENSE_CATEGORIES];
}

module.exports = {
  categorizeExpense,
  categorizeBatch,
  isValidCategory,
  getValidCategories,
};
