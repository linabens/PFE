const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middleware/auth');

// Staff/admin login
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Password recovery
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-code', AuthController.verifyCode);
router.post('/reset-password', AuthController.resetPassword);

// Profile (protected)
router.get('/profile', authenticateToken, AuthController.getProfile);
router.patch('/profile', authenticateToken, AuthController.updateProfile);
router.patch('/profile/password', authenticateToken, AuthController.changePassword);

module.exports = router;
