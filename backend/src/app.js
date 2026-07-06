const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const config = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactions');
const aiRoutes = require('./routes/ai');
const budgetRoutes = require('./routes/budget');
const analyticsRoutes = require('./routes/analytics');
const forecastRoutes = require('./routes/forecasts');
const categoryRoutes = require('./routes/categories');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: config.cors.origin }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/categories', categoryRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

module.exports = app;
