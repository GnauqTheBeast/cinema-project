const authService = require('../services/authService');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.Id;
      const profile = await authService.getProfile(userId);
      
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Logout user (client-side token removal)
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is typically handled client-side
      // by removing the token from storage
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(400).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(400).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Get user and generate new tokens
      const profile = await authService.getProfile(decoded.userId);
      const newAccessToken = authService.generateToken(decoded.userId, profile.userType);
      const newRefreshToken = authService.generateRefreshToken(decoded.userId);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }
      
      res.status(400).json({
        success: false,
        message: 'Token refresh failed',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Health check
  async health(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Service unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();
