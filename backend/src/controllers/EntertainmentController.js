const EntertainmentService = require('../services/EntertainmentService');

class EntertainmentController {
  async getQuotes(req, res, next) {
    try {
      const { limit } = req.query;
      const data = EntertainmentService.getQuotes(limit ? parseInt(limit) : undefined);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
  async getTips(req, res, next) {
    try {
      const { limit } = req.query;
      const data = EntertainmentService.getTips(limit ? parseInt(limit) : undefined);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
  async getVideos(req, res, next) {
    try {
      const { limit } = req.query;
      const data = EntertainmentService.getVideos(limit ? parseInt(limit) : undefined);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EntertainmentController();
