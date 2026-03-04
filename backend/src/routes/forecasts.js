const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecastController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all forecast routes
router.use(authenticate);

// Generate a new forecast
router.post('/generate', forecastController.generateForecast);

// Get the latest forecast
router.get('/latest', forecastController.getLatestForecast);

// Get all forecasts
router.get('/', forecastController.getAllForecasts);

// Get forecast by month
router.get('/month/:month', forecastController.getForecastByMonth);

// Get forecast breakdown
router.get('/breakdown', forecastController.getForecastBreakdown);

module.exports = router;
