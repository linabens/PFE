const LoyaltyService = require('../services/LoyaltyService');

class LoyaltyController {

  /**
   * POST /api/loyalty/lookup
   * Body: { customer_name, phone_number?, customer_id_number? }
   */
  async lookup(req, res, next) {
    try {
      const account = await LoyaltyService.lookup(req.body);
      res.json({ success: true, data: account });
    } catch (err) { next(err); }
  }

  /**
   * POST /api/loyalty/register
   * Body: { customer_name, phone_number?, customer_id_number? }
   */
  async register(req, res, next) {
    try {
      const account = await LoyaltyService.register(req.body);
      res.status(201).json({ success: true, data: account });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/loyalty/:id
   */
  async getAccount(req, res, next) {
    try {
      const account = await LoyaltyService.getAccount(parseInt(req.params.id));
      res.json({ success: true, data: account });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/loyalty/:id/transactions
   */
  async getTransactions(req, res, next) {
    try {
      const { limit } = req.query;
      const transactions = await LoyaltyService.getTransactions(
        parseInt(req.params.id),
        limit ? parseInt(limit) : 20
      );
      res.json({ success: true, data: transactions, count: transactions.length });
    } catch (err) { next(err); }
  }

  /**
   * POST /api/loyalty/:id/earn
   * Body: { order_id, order_total }
   */
  async earnPoints(req, res, next) {
    try {
      const { order_id, order_total } = req.body;
      if (!order_total) {
        return res.status(400).json({ success: false, error: 'order_total est requis' });
      }
      const result = await LoyaltyService.earnPoints(
        parseInt(req.params.id),
        order_id ? parseInt(order_id) : null,
        parseFloat(order_total)
      );
      res.json({ success: true, data: result, message: `+${result.points_added} points gagnés !` });
    } catch (err) { next(err); }
  }

  /**
   * PATCH /api/loyalty/:id/redeem
   * Body: { points }
   */
  async redeemPoints(req, res, next) {
    try {
      const { points } = req.body;
      const result = await LoyaltyService.redeemPoints(parseInt(req.params.id), parseInt(points));
      res.json({
        success: true,
        data: result,
        message: `${result.points_used} points utilisés. Solde: ${result.remaining} pts.`,
      });
    } catch (err) { next(err); }
  }

  /**
   * GET /api/admin/loyalty (admin only)
   */
  async listAll(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const data = await LoyaltyService.listAll(
        limit ? parseInt(limit) : 50,
        offset ? parseInt(offset) : 0
      );
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = new LoyaltyController();
