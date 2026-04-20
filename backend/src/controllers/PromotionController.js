const PromotionModel = require('../models/PromotionModel');

const PromotionController = {
  /**
   * Get all active promotions
   */
  getPromotions: async (req, res) => {
    try {
      const promotions = await PromotionModel.findAll({ isActive: true });
      res.json({ success: true, data: promotions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get all promotions (for admin)
   */
  getAllPromotions: async (req, res) => {
    try {
      const promotions = await PromotionModel.findAll({ isActive: null });
      res.json({ success: true, data: promotions });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Create a promotion
   */
  createPromotion: async (req, res) => {
    try {
      const promotion = await PromotionModel.create(req.body);
      res.status(201).json({ success: true, data: promotion });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete a promotion
   */
  deletePromotion: async (req, res) => {
    try {
      const { id } = req.params;
      await PromotionModel.delete(id);
      res.json({ success: true, message: 'Promotion supprimée' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Toggle promotion status
   */
  toggleStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const promotion = await PromotionModel.updateStatus(id, is_active);
      res.json({ success: true, data: promotion });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = PromotionController;
