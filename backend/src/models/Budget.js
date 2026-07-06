const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0.01, 'Budget limit must be greater than 0'],
      max: [999999999, 'Budget limit is too large'],
      validate: {
        validator: Number.isFinite,
        message: 'Budget limit must be a finite number',
      },
    },
    period: {
      type: String,
      enum: {
        values: ['monthly', 'yearly'],
        message: 'Period must be either monthly or yearly',
      },
      required: [true, 'Budget period is required'],
    },
    lastUpdated: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

// Actual spend is always computed live from Transaction data (see
// budgetService.calculateBudgetSpent) rather than stored here, so a single
// budget per user/category/period is enforced at the database level.
budgetSchema.index({ userId: 1, category: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
