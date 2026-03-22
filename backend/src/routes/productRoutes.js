const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const { authenticateToken, authorizeRoles } = require('../middleware');

// Public endpoints
router.get('/', ProductController.list);
router.get('/:id', ProductController.get);
router.get('/trending/list', (req, res, next) => {
  // force trending filter
  req.query.is_trending = 'true';
  return ProductController.list(req, res, next);
});

// Admin-only management endpoints
router.post('/', authenticateToken, authorizeRoles('staff','admin'), ProductController.create);
router.patch('/:id', authenticateToken, authorizeRoles('staff','admin'), ProductController.update);
router.delete('/:id', authenticateToken, authorizeRoles('staff','admin'), ProductController.delete);

module.exports = router;

