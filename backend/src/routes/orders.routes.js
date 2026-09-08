// =====================================================================
// Routes de gestion des commandes
// =====================================================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const controller = require('../controllers/orders.controller');

router.post('/', controller.createOrder);
router.get('/:id/track', controller.trackOrder);

router.get('/', auth, controller.getOrders);
router.patch(
  '/:id/statut',
  auth,
  requireRole('admin', 'gerant', 'serveur', 'cuisinier'),
  controller.updateOrderStatus
);

module.exports = router;
