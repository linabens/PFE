const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel');
const config = require('../config');
const ApiError = require('../utils/apiError');

class AuthService {
  /**
   * Generate JWT for a user object.
   */
  generateToken(user) {
    const payload = {
      sub: user.id,
      role: user.role,
    };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
  }

  /**
   * Authenticate staff/admin credentials and return token.
   */
  async login(email, password) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw ApiError.unauthorized('Invalid credentials');
    }
    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Hash a plain-text password
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Register a new user
   */
  async register(data) {
    const { full_name, email, password, role, avatar, security_question, security_answer } = data;
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      throw ApiError.badRequest('Email already in use');
    }
    const password_hash = await this.hashPassword(password);
    const user = await UserModel.create({
      full_name,
      email,
      password_hash,
      role: role || 'staff',
      avatar,
      security_question,
      security_answer
    });
    // Remove hash from returned object
    delete user.password_hash;
    return user;
  }

  /**
   * Get user security question by email
   */
  async getSecurityQuestion(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('No account found with this email');
    }
    return { 
      question: user.security_question || 'What is your favorite coffee blend?',
      email: user.email 
    };
  }

  /**
   * Verify security answer and return reset token
   */
  async verifySecurityAnswer(email, answer) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('No account found');
    }
    
    if (user.security_answer?.toLowerCase() !== answer.toLowerCase()) {
      throw ApiError.badRequest('Incorrect answer to security question');
    }

    // Return a temporary token (using sub as email for simplicity in this flow)
    const resetToken = jwt.sign({ sub: user.email, type: 'reset' }, config.jwtSecret, { expiresIn: '15m' });
    return { resetToken };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw ApiError.badRequest('Current password is incorrect');
    const password_hash = await this.hashPassword(newPassword);
    await UserModel.update(userId, { password_hash });
    return { success: true };
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetToken, newPassword) {
    try {
      const decoded = jwt.verify(resetToken, config.jwtSecret);
      if (decoded.type !== 'reset') throw new Error('Invalid token type');
      
      const email = decoded.sub;
      const user = await UserModel.findByEmail(email);
      if (!user) throw new Error('User not found');

      const password_hash = await this.hashPassword(newPassword);
      await UserModel.update(user.id, { password_hash });
      
      return { success: true };
    } catch (err) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }
  }
}

module.exports = new AuthService();
