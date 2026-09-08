// =====================================================================
// Routes du tableau de bord (statistiques)
// =====================================================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const controller = require('../controllers/dashboard.controller');

router.get('/stats', auth, requireRole('admin', 'gerant'), controller.getStats);

module.exports = router;
