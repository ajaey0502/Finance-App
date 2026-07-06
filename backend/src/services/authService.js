const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getTokenExpiry,
} = require('../utils/tokenUtils');
const { AppError } = require('../middleware/errorHandler');
const { validateEmail, validatePassword } = require('../middleware/validator');
const categoryService = require('./categoryService');
const logger = require('../utils/logger');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function issueTokenPair(user) {
  const payload = { userId: user._id.toString(), email: user.email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getTokenExpiry(refreshToken),
  });

  return { accessToken, refreshToken };
}

async function registerUser(email, password, name) {
  if (!validateEmail(email)) {
    throw new AppError(400, 'Invalid email format');
  }

  if (!validatePassword(password)) {
    throw new AppError(
      400,
      'Password must be 8-128 characters and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)'
    );
  }

  let user;
  try {
    user = new User({ email, password, name });
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(400, 'Email already registered');
    }
    throw error;
  }

  await categoryService.initializeDefaultCategories(user._id).catch((error) => {
    logger.error('Failed to seed default categories for new user:', error);
  });

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
}

async function loginUser(email, password) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      423,
      `Account temporarily locked due to repeated failed logins. Try again in ${minutesLeft} minute(s).`
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      user.failedLoginAttempts = 0;
      logger.warn('Account locked after repeated failed logins', { userId: user._id.toString() });
    }
    await user.save();
    throw new AppError(401, 'Invalid credentials');
  }

  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
}

async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return user;
}

async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt.getTime() < Date.now()) {
    throw new AppError(401, 'Refresh token has been revoked or is no longer valid');
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError(401, 'User not found');
  }

  // Rotate: invalidate the presented refresh token and issue a brand new pair.
  storedToken.revoked = true;
  await storedToken.save();

  const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(user);

  return { accessToken, refreshToken: newRefreshToken };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revoked: true } });
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  refreshAccessToken,
  logoutUser,
};
