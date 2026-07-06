const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError(400, 'Email, password, and name are required');
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
      throw new AppError(400, 'Invalid input types');
    }

    const result = await authService.registerUser(email.trim(), password, name.trim());

    logger.info('User registered successfully', { email: result.user.email });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new AppError(400, 'Invalid input types');
    }

    const result = await authService.loginUser(email.trim(), password);

    logger.info('User logged in successfully', { email: result.user.email });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(400, 'Refresh token is required');
    }

    if (typeof refreshToken !== 'string') {
      throw new AppError(400, 'Invalid refresh token format');
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const user = await authService.getUserById(req.userId);

    res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);

    logger.info('User logged out', { userId: req.userId });

    res.status(200).json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error) {
    next(error);
  }
}

async function validateSession(req, res, next) {
  try {
    if (!req.userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const user = await authService.getUserById(req.userId);

    res.status(200).json({
      success: true,
      message: 'Session is valid',
      isValid: true,
      userId: user._id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  validateSession,
};
