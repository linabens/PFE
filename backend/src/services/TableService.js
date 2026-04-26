const TableModel = require('../models/TableModel');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');

class TableService {

  /**
   * List all tables (admin view with stats)
   */
  async listAll() {
    return TableModel.findAll();
  }

  /**
   * List active tables (client view)
   */
  async listActive() {
    return TableModel.findAllActive();
  }

  /**
   * Get a single table by ID
   */
  async getById(tableId) {
    const table = await TableModel.findById(tableId);
    if (!table) throw ApiError.notFound('Table introuvable.');
    return table;
  }

  /**
   * Create a new table with auto-generated QR code
   */
  async createTable({ table_number, capacity = 4 }) {
    if (!table_number || table_number < 1) {
      throw ApiError.badRequest('Numéro de table requis (>= 1).');
    }

    // Check uniqueness
    const existing = await TableModel.findByNumber(table_number);
    if (existing) {
      throw ApiError.badRequest(`La table n°${table_number} existe déjà.`);
    }

    // Generate unique QR code value
    const qr_code = this._generateQrCode(table_number);

    return TableModel.create({ table_number, capacity, qr_code });
  }

  /**
   * Update a table
   */
  async updateTable(tableId, data) {
    const table = await TableModel.findById(tableId);
    if (!table) throw ApiError.notFound('Table introuvable.');

    // If changing table_number, check uniqueness
    if (data.table_number && data.table_number !== table.table_number) {
      const existing = await TableModel.findByNumber(data.table_number);
      if (existing) {
        throw ApiError.badRequest(`La table n°${data.table_number} existe déjà.`);
      }
    }

    return TableModel.update(tableId, data);
  }

  /**
   * Deactivate a table (soft delete)
   */
  async deactivateTable(tableId) {
    const table = await TableModel.findById(tableId);
    if (!table) throw ApiError.notFound('Table introuvable.');
    return TableModel.deactivate(tableId);
  }

  /**
   * Regenerate QR code for a table
   */
  async regenerateQrCode(tableId) {
    const table = await TableModel.findById(tableId);
    if (!table) throw ApiError.notFound('Table introuvable.');

    const newQrCode = this._generateQrCode(table.table_number);
    return TableModel.update(tableId, { qr_code: newQrCode });
  }

  /**
   * Get QR code data for a table (URL that the QR code should encode)
   */
  getQrCodeUrl(table, baseUrl = 'http://localhost:3000') {
    return {
      table_id: table.id,
      table_number: table.table_number,
      qr_code: table.qr_code,
      qr_url: `${baseUrl}/api/sessions/scan/${table.qr_code}`,
      // This URL is what gets encoded into the physical QR code
      // When scanned, the client app calls this URL to create a session
    };
  }

  // ── Internal ──────────────────────────────────────────────────────────────────
  _generateQrCode(tableNumber) {
    const unique = crypto.randomBytes(8).toString('hex');
    return `QR-TABLE-${String(tableNumber).padStart(3, '0')}-${unique}`;
  }
}

module.exports = new TableService();
