const AuthService = require('../services/AuthService');
const UserModel = require('../models/UserModel');
const ApiError = require('../utils/apiError');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login(email, password);
      res.json({ success: true, data: { user, token } });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const data = await AuthService.getSecurityQuestion(email);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async verifyCode(req, res, next) {
    try {
      const { email, code: answer } = req.body; // In this flow, "code" is the security answer
      const { resetToken } = await AuthService.verifySecurityAnswer(email, answer);
      res.json({ success: true, data: { resetToken } });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      await AuthService.resetPassword(resetToken, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const { password_hash, security_answer, ...profile } = req.user;
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const allowed = ['full_name', 'phone', 'avatar'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (Object.keys(updates).length === 0) {
        throw ApiError.badRequest('No valid fields to update');
      }
      const updated = await UserModel.update(req.user.id, updates);
      const { password_hash, security_answer, ...profile } = updated;
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw ApiError.badRequest('currentPassword and newPassword are required');
      }
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
