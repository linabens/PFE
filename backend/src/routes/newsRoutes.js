const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/NewsController');

// GET /api/news?category=general|sports|technology&limit=10
router.get('/', NewsController.getArticles);

module.exports = router;
