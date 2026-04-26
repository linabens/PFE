const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/CategoryController');
const { authenticateToken, authorizeRoles } = require('../middleware');

// Public
router.get('/', CategoryController.list);

// Admin
router.post('/', authenticateToken, authorizeRoles('staff','admin'), CategoryController.create);
router.patch('/:id', authenticateToken, authorizeRoles('staff','admin'), CategoryController.update);
router.delete('/:id', authenticateToken, authorizeRoles('staff','admin'), CategoryController.delete);

module.exports = router;

