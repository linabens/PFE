const express = require('express');
const router = express.Router();
const PromotionController = require('../controllers/PromotionController');
// Import admin middleware if necessary, though for now let's keep it simple
// or match existing patterns in sessionRoutes.js

// Public: Get active promotions for the mobile app
router.get('/', PromotionController.getPromotions);

// Admin: Get all, create, delete, toggle
router.get('/all', PromotionController.getAllPromotions);
router.post('/', PromotionController.createPromotion);
router.delete('/:id', PromotionController.deletePromotion);
router.patch('/:id/status', PromotionController.toggleStatus);

module.exports = router;
