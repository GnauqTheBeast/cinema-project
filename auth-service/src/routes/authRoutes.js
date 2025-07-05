const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest, registerSchema, loginSchema } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/health', authController.health);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/logout', authenticateToken, authController.logout);

// Admin only routes (Staff)
router.get('/admin/users', authenticateToken, requireRole(['Staff']), (req, res) => {
  res.json({
    success: true,
    message: 'Admin endpoint - list all users',
    user: req.user.username
  });
});

module.exports = router;
