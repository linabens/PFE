const express = require('express');
const router = express.Router();
const SessionModel = require('../models/SessionModel');
const LoyaltyModel = require('../models/LoyaltyModel');
const config = require('../config');
const { verifyQrScanSignature } = require('../utils/qrSession');

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
        expires_at: session.expires_at,
        message: 'Session créée avec succès. Bienvenue!'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/scan/:qr_code
 * Scan a QR code → auto-create session linked to the table
 * This is the URL encoded in the physical QR code on each table
 */
router.get('/scan/:qr_code(*)', async (req, res, next) => {
  try {
    const { qr_code } = req.params;
    const { ts, sig } = req.query;
    const requireSig = config.qrSessionRequireSignature === true;

    if (requireSig || ts || sig) {
      if (!verifyQrScanSignature(qr_code, ts, sig)) {
        return res.status(403).json({
          success: false,
          error: 'QR code invalide ou expiré — rescannez le code à la table.',
        });
      }
    }

    // Find the table by its QR code
    const TableModel = require('../models/TableModel');
    const table = await TableModel.findByQrCode(qr_code);

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'QR code invalide — aucune table trouvée.'
      });
    }

    if (!table.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Cette table est actuellement désactivée.'
      });
    }

    // Auto-create a session linked to this table
    const session = await SessionModel.create(table.id);

    res.status(200).json({
      success: true,
      data: {
        id: session.id,
        token: session.token,
        table_id: table.id,
        table_number: table.table_number,
        expires_at: session.expires_at,
        message: `Bienvenue à la table ${table.table_number} ! Votre session est prête.`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions/leave
 * Le client termine sa session (quitte le café) — le token ne pourra plus commander.
 * Header: x-session-token (ou body / query)
 * Ne passe pas par authenticateSession : on peut fermer même une session déjà expirée.
 */
router.post('/leave', async (req, res, next) => {
  try {
    const token =
      req.headers['x-session-token'] || req.query.session_token || req.body.session_token;
    if (!token) {
      return res.status(400).json({ success: false, error: 'session_token est requis' });
    }
    const closed = await SessionModel.closeByToken(token);
    if (!closed) {
      return res.status(400).json({
        success: false,
        error: 'Session déjà fermée ou token invalide.',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Session terminée. À bientôt !',
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

    const existing = await SessionModel.findByToken(session_token);
    if (!existing) {
      return res.status(401).json({ success: false, error: 'Session invalide.' });
    }
    const v = SessionModel.validateSessionRow(existing);
    if (!v.ok) {
      return res.status(401).json({
        success: false,
        error: 'Session expirée ou fermée. Rescannez le QR code.',
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
