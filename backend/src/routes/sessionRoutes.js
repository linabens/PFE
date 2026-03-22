const express = require('express');
const router = express.Router();
const SessionModel = require('../models/SessionModel');
const LoyaltyModel = require('../models/LoyaltyModel');

/**
 * POST /api/sessions
 * Create a new anonymous customer session (no personal info required)
 * Optional: table_id from QR code
 * Body: { table_id (optional) }
 */
router.post('/', async (req, res, next) => {
  try {
    const { table_id } = req.body;
    
    // Create anonymous session
    const session = await SessionModel.create(
      table_id ? parseInt(table_id) : null
    );
    
    res.status(200).json({ 
      success: true, 
      data: {
        id: session.id,
        token: session.token,
        table_id: session.table_id,
        message: 'Session créée avec succès. Bienvenue!'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/loyalty
 * Enroll or link customer to loyalty account
 * Body: { session_token, customer_name (required), phone_number (optional), customer_id_number (optional) }
 */
router.post('/loyalty', async (req, res, next) => {
  try {
    const { session_token, customer_name, phone_number, customer_id_number } = req.body;
    
    if (!session_token) {
      return res.status(400).json({ 
        success: false, 
        error: 'session_token is required' 
      });
    }
    
    if (!customer_name || customer_name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer name is required for loyalty enrollment' 
      });
    }
    
    // Find or create loyalty account with name (required), phone & ID (optional)
    const loyaltyAccount = await LoyaltyModel.findOrCreate({
      customer_name,
      phone_number: phone_number || null,
      customer_id_number: customer_id_number || null
    });
    
    // Link session to loyalty account
    const updatedSession = await SessionModel.linkToLoyalty(
      session_token,
      customer_name,
      phone_number || null,
      loyaltyAccount.id
    );
    
    res.status(200).json({ 
      success: true, 
      data: {
        session: updatedSession,
        loyalty_account: loyaltyAccount,
        message: `Welcome ${customer_name}! Your loyalty points are now active.`,
        points: loyaltyAccount.points
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/loyalty/:customer_name
 * Get loyalty account info (total points)
 * Optional: ?id_number=xxx
 */
router.get('/loyalty/:customer_name', async (req, res, next) => {
  try {
    const { customer_name } = req.params;
    const { id_number } = req.query;
    
    const loyaltyAccount = await LoyaltyModel.findByName(
      customer_name,
      id_number || null
    );
    
    if (!loyaltyAccount) {
      return res.status(404).json({ 
        success: false, 
        error: 'Compte de loyauté non trouvé' 
      });
    }
    
    res.json({ 
      success: true, 
      data: loyaltyAccount 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
