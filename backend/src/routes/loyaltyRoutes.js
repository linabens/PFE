const express = require('express');
const router = express.Router();
const LoyaltyController = require('../controllers/LoyaltyController');
const { authenticateSession } = require('../middleware');

// Loyalty management (Admin & Public)
router.get('/',      LoyaltyController.listAll);
router.post('/',     LoyaltyController.register); // Admin creation
router.get('/:id',   LoyaltyController.getAccount);
router.put('/:id',   LoyaltyController.update);
router.delete('/:id', LoyaltyController.delete);

// Public loyalty routes (can be accessed from home via mobile app)
router.post('/lookup',   LoyaltyController.lookup);
router.post('/register', LoyaltyController.register);
router.post('/login',    LoyaltyController.login);

// Account details & transactions
router.get('/:id/transactions', LoyaltyController.getTransactions);

// Earn & Redeem
router.post('/:id/earn',    LoyaltyController.earnPoints);
router.patch('/:id/redeem', LoyaltyController.redeemPoints);

module.exports = router;
