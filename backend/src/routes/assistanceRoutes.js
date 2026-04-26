const express = require('express');
const router = express.Router();
const AssistanceModel = require('../models/AssistanceModel');
const TableModel = require('../models/TableModel');
const { authenticateSession, authenticateToken, authorizeRoles } = require('../middleware');

/**
 * POST /api/assistance
 * Appeler un serveur (Call Waiter)
 * Body: { table_id }
 * Public endpoint - requires session token from customer
 */
router.post('/', authenticateSession, async (req, res) => {
  try {
    // use table_id from session when possible
    const table_id = (req.session && req.session.table_id)
      || req.body.table_id;
    
    if (!table_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'table_id est requis' 
      });
    }
    
    // Vérifier que la table existe et est active
    const table = await TableModel.findById(parseInt(table_id));
    
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        error: 'Table non trouvée' 
      });
    }
    
    if (!table.is_active) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cette table n\'est pas active' 
      });
    }
    
    // Vérifier s'il y a déjà une demande en attente
    const hasPending = await AssistanceModel.hasPendingRequest(parseInt(table_id));
    
    if (hasPending) {
      return res.status(409).json({ 
        success: false, 
        error: 'Une demande d\'assistance est déjà en attente pour cette table' 
      });
    }
    
    // Créer la demande
    const request = await AssistanceModel.createRequest(parseInt(table_id));
    
    res.status(201).json({ 
      success: true, 
      data: request, 
      message: 'Serveur appelé avec succès!' 
    });
    
  } catch (error) {
    console.error('Erreur création demande assistance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/assistance/pending
 * Récupérer toutes les demandes en attente (pour le staff)
 */
router.get('/pending', authenticateToken, authorizeRoles('staff','admin'), async (req, res) => {
  try {
    const requests = await AssistanceModel.findPending();
    
    res.json({ 
      success: true, 
      data: requests,
      count: requests.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/assistance/:id
 * Récupérer une demande par ID
 */
router.get('/:id', async (req, res) => {
  try {
    const request = await AssistanceModel.findById(parseInt(req.params.id));
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }
    
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/assistance/:id/handle
 * Marquer une demande comme traitée
 */
router.patch('/:id/handle', authenticateToken, authorizeRoles('staff','admin'), async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // Vérifier que la demande existe
    const request = await AssistanceModel.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Demande non trouvée' 
      });
    }
    
    if (request.status === 'handled') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cette demande a déjà été traitée' 
      });
    }
    
    // Marquer comme traitée
    const updatedRequest = await AssistanceModel.markHandled(requestId);
    
    res.json({ 
      success: true, 
      data: updatedRequest, 
      message: 'Demande marquée comme traitée' 
    });
    
  } catch (error) {
    console.error('Erreur traitement demande:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/assistance/table/:tableId
 * Récupérer l'historique des demandes d'une table
 */
router.get('/table/:tableId', authenticateToken, authorizeRoles('staff','admin'), async (req, res) => {
  try {
    const { status, limit } = req.query;
    const requests = await AssistanceModel.findByTable(
      parseInt(req.params.tableId),
      {
        status,
        limit: limit ? parseInt(limit) : 20,
      }
    );
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

