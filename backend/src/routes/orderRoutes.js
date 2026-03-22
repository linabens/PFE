const express = require('express');
const router = express.Router();
const OrderModel = require('../models/OrderModel');
const ProductModel = require('../models/ProductModel');
const pool = require('../database/pool');
const { authenticateSession, authenticateToken, optionalAuthenticateToken, authorizeRoles } = require('../middleware');

/**
 * POST /api/orders
 * Créer une nouvelle commande
 * Body: { table_id, user_id (optionnel), items: [{ product_id, quantity, options: [...] }] }
 */
router.post('/', authenticateSession, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { table_id: bodyTableId, user_id, items, loyalty_used } = req.body;
    // session information added by middleware
    const sessionId = req.session && req.session.id;
    const table_id = bodyTableId ? parseInt(bodyTableId) : (req.session && req.session.table_id);

    if (!table_id) {
      return res.status(400).json({ success: false, error: 'table_id est requis' });
    }
    
    if (!table_id) {
      return res.status(400).json({ success: false, error: 'table_id est requis' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Au moins un produit est requis' });
    }
    
    await client.query('BEGIN');
    
    // Calculer le total de la commande
    let totalPrice = 0;
    const processedItems = [];
    
    for (const item of items) {
      // Récupérer le produit
      const product = await ProductModel.findById(item.product_id);
      
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          error: `Produit avec ID ${item.product_id} non trouvé` 
        });
      }
      
      if (!product.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          error: `Le produit "${product.name}" n'est pas disponible` 
        });
      }
      
      // Calculer le prix unitaire avec les options
      let unitPrice = parseFloat(product.price);
      const selectedOptions = [];
      
      if (item.options && item.options.length > 0) {
        for (const selectedOption of item.options) {
          // Trouver l'option dans les options du produit
          const optionType = product.options[selectedOption.option_type];
          if (optionType) {
            const option = optionType.find(o => o.id === selectedOption.option_id);
            if (option) {
              unitPrice += parseFloat(option.price_modifier);
              selectedOptions.push({
                option_name: option.name,
                price_modifier: option.price_modifier,
              });
            }
          }
        }
      }
      
      const quantity = item.quantity || 1;
      const subtotal = unitPrice * quantity;
      totalPrice += subtotal;
      
      processedItems.push({
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        subtotal,
        options: selectedOptions,
      });
    }
    
    // Créer la commande
    const order = await OrderModel.createOrder(
      {
        table_id: parseInt(table_id),
        session_id: sessionId,
        user_id: user_id ? parseInt(user_id) : null,
        status: 'new',
        total_price: totalPrice,
        loyalty_used: loyalty_used || false,
      },
      processedItems,
      client
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({ success: true, data: order, message: 'Commande créée avec succès' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur création commande:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/orders/table/:tableId
 * Récupérer toutes les commandes d'une table
 */
router.get('/table/:tableId', authenticateToken, authorizeRoles('staff','admin'), async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    const orders = await OrderModel.findByTable(
      parseInt(req.params.tableId),
      {
        status,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      }
    );
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/active/list
 * Récupérer toutes les commandes actives (pour l'affichage cuisine)
 */
router.get('/active/list', authenticateToken, authorizeRoles('staff','admin'), async (req, res) => {
  try {
    const orders = await OrderModel.findActive();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/:id/invoice
 * Télécharger la facture PDF d'une commande
 * Accessible par le client de la session OU par staff/admin
 */
router.get('/:id/invoice', optionalAuthenticateToken, authenticateSession, async (req, res) => {
  try {
    const PdfService = require('../services/PdfService');
    const order = await OrderModel.findById(parseInt(req.params.id));

    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }

    // Ownership check: client session OR staff/admin token
    const hasStaffToken = req.user && ['staff', 'admin'].includes(req.user.role);
    if (!hasStaffToken && req.session && order.session_id !== req.session.id) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }

    PdfService.streamInvoice(order, res);
  } catch (error) {
    console.error('Erreur génération facture:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/orders/:id
 * Récupérer une commande par ID
 */
router.get('/:id', optionalAuthenticateToken, authenticateSession, async (req, res) => {
  try {
    const order = await OrderModel.findById(parseInt(req.params.id));
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }
    // If the session that made the request does not match the order and
    // there's no admin JWT attached, reject
    const hasStaffToken = req.user && ['staff','admin'].includes(req.user.role);
    if (!hasStaffToken && req.session && order.session_id !== req.session.id) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Mettre à jour le statut d'une commande
 * Body: { status: 'new' | 'brewing' | 'preparing' | 'ready' | 'completed', changed_by (optionnel) }
 */
router.patch('/:id/status', authenticateToken, authorizeRoles('staff','admin'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { status, changed_by } = req.body;
    const orderId = parseInt(req.params.id);
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Le statut est requis' });
    }
    
    const validStatuses = ['new', 'brewing', 'preparing', 'ready', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Statut invalide. Statuts valides: ${validStatuses.join(', ')}` 
      });
    }
    
    await client.query('BEGIN');
    
    const updatedOrder = await OrderModel.updateStatus(
      orderId,
      status,
      changed_by ? parseInt(changed_by) : null,
      client
    );
    
    await client.query('COMMIT');
    
    res.json({ success: true, data: updatedOrder, message: 'Statut mis à jour' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;


