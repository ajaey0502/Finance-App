const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authLimiter, refreshLimiter } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/validate', authenticate, authController.validateSession);

module.exports = router;
