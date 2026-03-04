const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
    },
    predictedAmount: {
      type: Number,
      required: [true, 'Predicted amount is required'],
      min: [0, 'Predicted amount cannot be negative'],
      max: [999999999, 'Predicted amount is too large'],
    },
    insight: {
      type: String,
      required: [true, 'Insight/explanation is required'],
      minlength: [10, 'Insight must be at least 10 characters'],
      maxlength: [1000, 'Insight cannot exceed 1000 characters'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable'],
      default: 'stable',
    },
    confidenceInterval: {
      lower: { type: Number, default: 0 },
      upper: { type: Number, default: 0 },
    },
    basedOnMonths: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
      max: 12,
    },
  },
  {
    timestamps: true,
  }
);

forecastSchema.index({ userId: 1, month: -1 });
forecastSchema.index({ userId: 1, createdAt: -1 });
forecastSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Forecast', forecastSchema);
