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
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '8h' });
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
}

module.exports = new AuthService();
