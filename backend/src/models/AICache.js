const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      minlength: [1, 'Description must be at least 1 character'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
      index: true,
      default: '',
    },
    suggestedCategory: {
      type: String,
      required: [true, 'Suggested category is required'],
      trim: true,
    },
    confidence: {
      type: Number,
      min: [0, 'Confidence cannot be less than 0'],
      max: [1, 'Confidence cannot be greater than 1'],
      default: 0.8,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

aiCacheSchema.index({ userId: 1, description: 1 });

module.exports = mongoose.model('AICache', aiCacheSchema);
