const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const { AppError } = require('../middleware/errorHandler');
const { validateEmail, validatePassword } = require('../middleware/validator');
const logger = require('../utils/logger');

async function registerUser(email, password, name) {
  if (!validateEmail(email)) {
    throw new AppError(400, 'Invalid email format');
  }

  if (!validatePassword(password)) {
    throw new AppError(400, 'Password must be at least 8 characters long');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, 'Email already registered');
  }

  const user = new User({ email, password, name });
  await user.save();

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    email: user.email,
  });

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

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid credentials');
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id.toString(),
    email: user.email,
  });

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
  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);

  if (!user) {
    throw new AppError(401, 'User not found');
  }

  const newAccessToken = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
  });

  return newAccessToken;
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  refreshAccessToken,
};
