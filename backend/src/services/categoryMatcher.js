const logger = require('../utils/logger');

// Comprehensive keyword matching rules
const KEYWORD_RULES = {
  Food: [
    'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'burger', 'pizza',
    'grocery', 'supermarket', 'food', 'lunch', 'dinner', 'breakfast', 'brunch',
    'bakery', 'deli', 'bistro', 'kitchen', 'eatery', 'dining', 'meal'
  ],
  Transportation: [
    'uber', 'lyft', 'taxi', 'cab', 'gas', 'fuel', 'petrol', 'parking',
    'metro', 'subway', 'bus', 'train', 'transit', 'toll', 'car', 'vehicle',
    'airline', 'flight', 'airport'
  ],
  Entertainment: [
    'netflix', 'spotify', 'hulu', 'disney', 'movie', 'cinema', 'theater',
    'concert', 'game', 'gaming', 'steam', 'playstation', 'xbox', 'ticket',
    'show', 'amusement', 'park', 'event'
  ],
  Utilities: [
    'electric', 'electricity', 'water', 'gas bill', 'internet', 'wifi',
    'phone', 'mobile', 'cable', 'utility', 'bill', 'power', 'energy'
  ],
  Healthcare: [
    'doctor', 'hospital', 'clinic', 'pharmacy', 'medicine', 'medical',
    'health', 'dentist', 'dental', 'prescription', 'drug', 'therapy'
  ],
  Shopping: [
    'amazon', 'ebay', 'walmart', 'target', 'mall', 'store', 'shop',
    'clothing', 'clothes', 'fashion', 'shoes', 'electronics', 'retail'
  ],
  Subscription: [
    'subscription', 'membership', 'premium', 'monthly', 'annual', 'yearly',
    'plan', 'service', 'recurring'
  ],
  Rent: [
    'rent', 'lease', 'landlord', 'apartment', 'housing'
  ],
  Education: [
    'school', 'college', 'university', 'tuition', 'course', 'class',
    'book', 'education', 'training', 'workshop'
  ],
};

/**
 * Match description against keyword rules
 * @param {string} description - Transaction description
 * @returns {{category: string, confidence: number, source: string} | null}
 */
function matchByKeywords(description) {
  if (!description || typeof description !== 'string') {
    return null;
  }

  const lowerDesc = description.toLowerCase().trim();
  
  // Skip if too short or nonsensical (just numbers/symbols)
  if (lowerDesc.length < 2) {
    return null;
  }

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(KEYWORD_RULES)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        logger.debug(`Keyword match: "${description}" -> ${category} (keyword: ${keyword})`);
        return {
          category,
          confidence: 0.95,
          source: 'keyword'
        };
      }
    }
  }

  return null;
}

/**
 * Check if description is nonsensical (only symbols, numbers, gibberish)
 * @param {string} description
 * @returns {boolean}
 */
function isNonsensical(description) {
  if (!description || typeof description !== 'string') {
    return true;
  }

  const trimmed = description.trim();
  
  // Too short
  if (trimmed.length < 2) {
    return true;
  }

  // Only numbers and symbols
  const alphaCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (alphaCount < 2) {
    return true;
  }

  // Random gibberish patterns (very short "words" or excessive repetition)
  const words = trimmed.split(/\s+/);
  const shortWords = words.filter(w => w.length < 2).length;
  if (shortWords / words.length > 0.7) {
    return true;
  }

  return false;
}

module.exports = {
  matchByKeywords,
  isNonsensical,
  KEYWORD_RULES
};
