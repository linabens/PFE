const express = require('express');
const router = express.Router();
const LoyaltyController = require('../controllers/LoyaltyController');
const { authenticateSession } = require('../middleware');

// Public loyalty routes (can be accessed from home via mobile app)
router.post('/lookup',   LoyaltyController.lookup);
router.post('/register', LoyaltyController.register);
router.post('/login',    LoyaltyController.login);

// Account details & transactions
router.get('/:id',              LoyaltyController.getAccount);
router.get('/:id/transactions', LoyaltyController.getTransactions);

// Earn & Redeem
router.post('/:id/earn',    LoyaltyController.earnPoints);
router.patch('/:id/redeem', LoyaltyController.redeemPoints);

module.exports = router;
