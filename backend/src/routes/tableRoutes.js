const express = require('express');
const router = express.Router();
const TableService = require('../services/TableService');
const { authenticateToken, authorizeRoles } = require('../middleware');

// All table management routes require admin JWT
router.use(authenticateToken, authorizeRoles('admin'));

/**
 * GET /api/tables
 * Liste toutes les tables avec stats (commandes actives, dernière session)
 */
router.get('/', async (req, res, next) => {
  try {
    const tables = await TableService.listAll();
    res.json({ success: true, data: tables, count: tables.length });
  } catch (err) { next(err); }
});

/**
 * GET /api/tables/:id
 * Détails d'une table
 */
router.get('/:id', async (req, res, next) => {
  try {
    const table = await TableService.getById(parseInt(req.params.id));
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

/**
 * POST /api/tables
 * Créer une nouvelle table
 * Body: { table_number, capacity? }
 */
router.post('/', async (req, res, next) => {
  try {
    const table = await TableService.createTable(req.body);
    res.status(201).json({
      success: true,
      data: table,
      message: `Table n°${table.table_number} créée avec QR code: ${table.qr_code}`,
    });
  } catch (err) { next(err); }
});

/**
 * PUT /api/tables/:id
 * Modifier une table
 * Body: { table_number?, capacity?, is_active? }
 */
router.put('/:id', async (req, res, next) => {
  try {
    const table = await TableService.updateTable(parseInt(req.params.id), req.body);
    res.json({ success: true, data: table });
  } catch (err) { next(err); }
});

/**
 * DELETE /api/tables/:id
 * Désactiver une table (soft delete)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const table = await TableService.deactivateTable(parseInt(req.params.id));
    res.json({ success: true, data: table, message: 'Table désactivée.' });
  } catch (err) { next(err); }
});

/**
 * POST /api/tables/:id/regenerate-qr
 * Régénérer le QR code d'une table
 */
router.post('/:id/regenerate-qr', async (req, res, next) => {
  try {
    const table = await TableService.regenerateQrCode(parseInt(req.params.id));
    const qrData = TableService.getQrCodeUrl(table);
    res.json({
      success: true,
      data: qrData,
      message: `Nouveau QR code généré: ${table.qr_code}`,
    });
  } catch (err) { next(err); }
});

/**
 * GET /api/tables/:id/qr
 * Obtenir les données QR pour une table (URL à encoder dans le QR physique)
 */
router.get('/:id/qr', async (req, res, next) => {
  try {
    const table = await TableService.getById(parseInt(req.params.id));
    const qrData = TableService.getQrCodeUrl(table);
    res.json({ success: true, data: qrData });
  } catch (err) { next(err); }
});

module.exports = router;
