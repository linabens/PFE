const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
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
   * Validate password strength criteria
   */
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (password.length < minLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      throw ApiError.badRequest('Le mot de passe ne respecte pas les critères de sécurité (min 8 caractères, majuscule, minuscule, chiffre et symbole)');
    }
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
    
    // Validate password strength
    this.validatePasswordStrength(password);

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
   * Send a 6-digit reset code to user's email
   */
  async sendResetCode(email) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('Aucun compte trouvé avec cet e-mail');
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Send email using Nodemailer
    try {
      let transporter;
      
      // If SMTP credentials are provided in .env, use them (e.g. Gmail)
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }

      await transporter.sendMail({
        from: '"Coffee Time Admin" <no-reply@coffeetime.com>',
        to: email,
        subject: "Votre code de récupération Coffee Time",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #2C1810; background-color: #F5E6D3; border-radius: 12px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #8B5742; text-align: center; margin-bottom: 24px;">Coffee Time Admin</h2>
            <p style="font-size: 16px;">Bonjour,</p>
            <p style="font-size: 16px;">Vous avez demandé la réinitialisation de votre mot de passe. Veuillez utiliser le code de validation ci-dessous :</p>
            <div style="background-color: white; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px solid #E8CABD;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3D2214;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #775144;">Ce code est valide pendant 15 minutes.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      throw ApiError.internal('Impossible d\'envoyer l\'e-mail de récupération.');
    }
    
    this.resetCodes = this.resetCodes || new Map();
    this.resetCodes.set(email.toLowerCase(), { code, expires: Date.now() + 15 * 60 * 1000 });
    
    return { message: "Un code de validation a été envoyé à votre e-mail" };
  }

  /**
   * Verify email reset code and return reset token
   */
  async verifyResetCode(email, code) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('Aucun compte trouvé');
    }
    
    this.resetCodes = this.resetCodes || new Map();
    const stored = this.resetCodes.get(email.toLowerCase());
    
    if (!stored) throw ApiError.badRequest('Aucun code de réinitialisation demandé');
    if (Date.now() > stored.expires) throw ApiError.badRequest('Le code a expiré');
    if (stored.code !== code) throw ApiError.badRequest('Code de vérification incorrect');

    this.resetCodes.delete(email.toLowerCase());
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
    if (!valid) throw ApiError.badRequest('Le mot de passe actuel est incorrect');
    
    // Validate new password strength
    this.validatePasswordStrength(newPassword);

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

      // Validate new password strength
      this.validatePasswordStrength(newPassword);

      const password_hash = await this.hashPassword(newPassword);
      await UserModel.update(user.id, { password_hash });
      
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.badRequest('Lien de réinitialisation invalide ou expiré');
    }
  }
}

module.exports = new AuthService();
