// =====================================================================
// Routes de gestion des tables (staff) + accès public via QR Code
// =====================================================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const controller = require('../controllers/tables.controller');

router.get('/public/:code', controller.getTableByCode);

router.get('/', auth, controller.getTables);
router.post('/', auth, requireRole('admin', 'gerant'), controller.createTable);
router.post('/:id/generate-qr', auth, requireRole('admin', 'gerant'), controller.generateQrCode);
router.put('/:id', auth, requireRole('admin', 'gerant', 'serveur'), controller.updateTable);
router.delete('/:id', auth, requireRole('admin', 'gerant'), controller.deleteTable);

module.exports = router;
