const NewsService = require('../services/NewsService');

class NewsController {
  async getArticles(req, res, next) {
    try {
      const { category = 'general', limit } = req.query;
      const articles = await NewsService.fetch(category, limit ? parseInt(limit) : 20);
      res.json({ success: true, data: articles, count: articles.length });
    } catch (err) {
      next(err);
    }
  }

  async getCacheStatus(req, res, next) {
    try {
      const status = NewsService.getCacheStatus();
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  }

  async refreshCache(req, res, next) {
    try {
      const result = await NewsService.refreshAll();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NewsController();
