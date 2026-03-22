const express = require('express');
const router = express.Router();
const AdminController    = require('../controllers/AdminController');
const NewsController     = require('../controllers/NewsController');
const LoyaltyController  = require('../controllers/LoyaltyController');
const { authenticateToken, authorizeRoles } = require('../middleware');

// All routes require staff or admin JWT
router.use(authenticateToken, authorizeRoles('staff', 'admin'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard',        AdminController.dashboard);

// ── Orders (Real-time kitchen view) ───────────────────────────────────────────
router.get('/orders/active',    AdminController.activeOrders);

// ── Tables ────────────────────────────────────────────────────────────────────
router.get('/tables',           AdminController.tables);

// ── Revenue & Stats ─────────────────────────────────────────────────────────
router.get('/revenue/summary',  AdminController.revenueSummary);
router.get('/peak-hours',       AdminController.peakHours);
router.get('/product-sales',    AdminController.productSales);
router.get('/daily-stats',      AdminController.dailyStats);

// ── Loyalty (admin view) ──────────────────────────────────────────────────────
router.get('/loyalty',          LoyaltyController.listAll);

// ── News Management (admin only) ──────────────────────────────────────────────
router.post('/news/refresh',    NewsController.refreshCache);

module.exports = router;
