const express = require('express');
const router = express.Router();
const AdminController    = require('../controllers/AdminController');
const NewsController     = require('../controllers/NewsController');
const LoyaltyController  = require('../controllers/LoyaltyController');
const { authenticateToken, authorizeRoles } = require('../middleware');

// All routes require staff or admin JWT
router.use(authenticateToken, authorizeRoles('staff', 'admin'));

// 🛡️ Dashboard & Analytics 🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️🛡️
router.get('/dashboard',        AdminController.dashboard);
router.get('/analytics',        AdminController.getAnalytics);

// ── Orders (Real-time kitchen view) ───────────────────────────────────────────
router.get('/orders/active',    AdminController.activeOrders);

// ── Tables ────────────────────────────────────────────────────────────────────
router.get('/tables',           AdminController.tables);
router.post('/tables',          AdminController.createTable);
router.put('/tables/:id',       AdminController.updateTable);
router.delete('/tables/:id',    AdminController.deleteTable);
router.post('/tables/:tableId/sessions/close-all', AdminController.closeTableSessions);

// ── Revenue & Stats ─────────────────────────────────────────────────────────
router.get('/revenue/summary',  AdminController.revenueSummary);
router.get('/peak-hours',       AdminController.peakHours);
router.get('/product-sales',    AdminController.productSales);
router.get('/daily-stats',      AdminController.dailyStats);

// ── Loyalty (admin view) ──────────────────────────────────────────────────────
router.get('/loyalty',          LoyaltyController.listAll);

// ── User Management (admin focus) ─────────────────────────────────────────────
router.get('/users',            AdminController.listUsers);

// ── News Management (admin only) ──────────────────────────────────────────────
router.post('/news/refresh',    NewsController.refreshCache);

module.exports = router;
