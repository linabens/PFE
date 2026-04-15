const express = require('express');
const router = express.Router();
const LoyaltyController = require('../controllers/LoyaltyController');
const { authenticateSession } = require('../middleware');

// All loyalty routes require a session (customer must have scanned QR)
router.use(authenticateSession);

// Lookup & Register
router.post('/lookup',   LoyaltyController.lookup);
router.post('/register', LoyaltyController.register);

// Account details & transactions
router.get('/:id',              LoyaltyController.getAccount);
router.get('/:id/transactions', LoyaltyController.getTransactions);

// Earn & Redeem
router.post('/:id/earn',    LoyaltyController.earnPoints);
router.patch('/:id/redeem', LoyaltyController.redeemPoints);

module.exports = router;
