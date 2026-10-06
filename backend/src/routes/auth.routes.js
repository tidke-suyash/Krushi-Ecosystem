const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public auth endpoints
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/exchange', authLimiter, authController.exchangeSsoCode);
router.post('/auth/logout', authController.logout);
router.get('/apps', authController.getApps);

// Protected endpoints
router.post('/auth/sso-code', authenticate, authController.createSsoCode);
router.get('/me', authenticate, authController.getMe);
router.patch('/me/profile', authenticate, authController.updateProfile);
router.post('/me/apps/:appId', authenticate, authController.enableApp);

module.exports = router;
