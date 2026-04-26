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
   * Login via phone number
   */
  async login(phone_number) {
    if (!phone_number) {
      throw ApiError.badRequest('Le numéro de téléphone est requis.');
    }
    const account = await LoyaltyModel.findByPhone(phone_number);
    if (!account) {
      throw ApiError.notFound('Aucun compte trouvé avec ce numéro de téléphone.');
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
    const eventKey = orderId ? `order:${orderId}:earn` : null;
    const tx = await pool.connect();
    try {
      await tx.query('BEGIN');
      const txn = await LoyaltyModel.createTransaction(
        loyaltyId,
        orderId,
        pointsToAdd,
        0,
        { source_type: 'order', source_id: orderId || null, event_key: eventKey, note: 'Auto credit on order completion' },
        tx
      );
      if (!txn) {
        await tx.query('ROLLBACK');
        return { points_added: 0, duplicated: true };
      }
      const account = await LoyaltyModel.addPoints(loyaltyId, pointsToAdd, tx);
      await tx.query('COMMIT');
      return { account, points_added: pointsToAdd };
    } catch (err) {
      await tx.query('ROLLBACK');
      throw err;
    } finally {
      tx.release();
    }
  }

  /**
   * Créditer le portefeuille fidélité après une partie (récompense calculée côté serveur dans GameService).
   * Pas de commande associée : order_id est NULL dans loyalty_transactions.
   */
  async earnGameRewardPoints(loyaltyId, pointsToAdd) {
    const points = Math.floor(Number(pointsToAdd) || 0);
    if (!loyaltyId || points <= 0) {
      return { points_added: 0, account: null };
    }
    const account = await LoyaltyModel.addPoints(loyaltyId, points);
    await LoyaltyModel.createTransaction(
      loyaltyId,
      null,
      points,
      0,
      { source_type: 'game', source_id: null, event_key: null, note: 'Legacy game reward credit' }
    );
    return { account, points_added: points };
  }

  async earnGameRewardPointsForSession(loyaltyId, gameSessionId, pointsToAdd) {
    const points = Math.floor(Number(pointsToAdd) || 0);
    if (!loyaltyId || !gameSessionId || points <= 0) {
      return { points_added: 0, account: null };
    }
    const eventKey = `game_session:${gameSessionId}:earn`;
    const tx = await pool.connect();
    try {
      await tx.query('BEGIN');
      const txn = await LoyaltyModel.createTransaction(
        loyaltyId,
        null,
        points,
        0,
        { source_type: 'game_session', source_id: gameSessionId, event_key: eventKey, note: 'Auto credit on game score submission' },
        tx
      );
      if (!txn) {
        await tx.query('ROLLBACK');
        return { points_added: 0, duplicated: true };
      }
      const account = await LoyaltyModel.addPoints(loyaltyId, points, tx);
      await tx.query('COMMIT');
      return { account, points_added: points };
    } catch (err) {
      await tx.query('ROLLBACK');
      throw err;
    } finally {
      tx.release();
    }
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
