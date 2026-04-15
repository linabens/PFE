const express = require('express');
const router = express.Router();
const EntertainmentController = require('../controllers/EntertainmentController');

// public endpoints, no auth required
router.get('/quotes', EntertainmentController.getQuotes);
router.get('/tips', EntertainmentController.getTips);
router.get('/videos', EntertainmentController.getVideos);

module.exports = router;
