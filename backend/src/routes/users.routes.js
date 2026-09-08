// =====================================================================
// Routes de gestion du personnel (réservées à l'administrateur)
// =====================================================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const controller = require('../controllers/users.controller');

router.get('/', auth, requireRole('admin'), controller.getUsers);
router.post('/', auth, requireRole('admin'), controller.createUser);
router.post('/:id/renvoyer-lien', auth, requireRole('admin'), controller.renewActivationLink);
router.patch('/:id/actif', auth, requireRole('admin'), controller.toggleActif);
router.delete('/:id', auth, requireRole('admin'), controller.deleteUser);

module.exports = router;
