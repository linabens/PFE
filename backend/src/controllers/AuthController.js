const AuthService = require('../services/AuthService');

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
}

module.exports = new AuthController();
