const LoyaltyModel = require('../models/LoyaltyModel');
const pool = require('../database/pool');
const ApiError = require('../utils/apiError');

// 1 loyalty point per 50 TND spent
const POINTS_PER_TND = 50;

class LoyaltyService {

  /**
   * Look up a loyalty account by name (+ optional phone/ID)
   */
  async lookup({ customer_name, phone_number, customer_id_number }) {
    if (!customer_name) {
      throw ApiError.badRequest('Le nom du client est requis.');
    }
    const account = await LoyaltyModel.findByName(customer_name, phone_number, customer_id_number);
    if (!account) {
      throw ApiError.notFound('Aucun compte fidélité trouvé pour ce nom.');
    }
    return account;
  }

  /**
   * Register (find or create) a loyalty account
   */
  async register({ customer_name, phone_number, customer_id_number }) {
    if (!customer_name || customer_name.trim().length < 2) {
      throw ApiError.badRequest('Le nom du client est requis (min 2 caractères).');
    }
    return LoyaltyModel.findOrCreate({ customer_name, phone_number, customer_id_number });
  }

  /**
   * Get account by ID with balance info
   */
  async getAccount(loyaltyId) {
    const result = await pool.query('SELECT * FROM loyalty_accounts WHERE id = $1', [loyaltyId]);
    if (!result.rows[0]) throw ApiError.notFound('Compte fidélité introuvable.');
    return result.rows[0];
  }

  /**
   * Get transaction history for an account
   */
  async getTransactions(loyaltyId, limit = 20) {
    const result = await pool.query(
      `SELECT lt.*, o.total_price, o.created_at AS order_date
       FROM loyalty_transactions lt
       LEFT JOIN orders o ON o.id = lt.order_id
       WHERE lt.loyalty_id = $1
       ORDER BY lt.created_at DESC
       LIMIT $2`,
      [loyaltyId, limit]
    );
    return result.rows;
  }

  /**
   * Earn points from an order
   * Called after order completion (1 pt per 50 TND)
   */
  async earnPoints(loyaltyId, orderId, orderTotal) {
    const pointsToAdd = Math.floor(orderTotal / POINTS_PER_TND);
    if (pointsToAdd <= 0) return { points_added: 0 };

    const account = await LoyaltyModel.addPoints(loyaltyId, pointsToAdd);
    await LoyaltyModel.createTransaction(loyaltyId, orderId, pointsToAdd, 0);
    return { account, points_added: pointsToAdd };
  }

  /**
   * Redeem (use) points
   * Returns updated account
   */
  async redeemPoints(loyaltyId, pointsToUse) {
    if (!pointsToUse || pointsToUse <= 0) {
      throw ApiError.badRequest('Le nombre de points à utiliser doit être positif.');
    }

    const account = await this.getAccount(loyaltyId);

    if (account.points < pointsToUse) {
      throw ApiError.badRequest(
        `Solde insuffisant. Vous avez ${account.points} points, mais vous essayez d'en utiliser ${pointsToUse}.`
      );
    }

    const updated = await LoyaltyModel.usePoints(loyaltyId, pointsToUse);
    await LoyaltyModel.createTransaction(loyaltyId, null, 0, pointsToUse);
    return { account: updated, points_used: pointsToUse, remaining: updated.points };
  }

  /**
   * Admin: list all loyalty accounts
   */
  async listAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM loyalty_accounts ORDER BY total_earned DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*)::int AS total FROM loyalty_accounts');
    return { accounts: result.rows, total: count.rows[0].total };
  }
}

module.exports = new LoyaltyService();
