// =====================================================================
// Routes de gestion du menu (catégories + produits)
// =====================================================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const controller = require('../controllers/menu.controller');

router.get('/public', controller.getMenu);
router.get('/', auth, controller.getMenu);

router.post('/categories', auth, requireRole('admin', 'gerant'), controller.createCategorie);
router.delete('/categories/:id', auth, requireRole('admin', 'gerant'), controller.deleteCategorie);

router.post('/produits', auth, requireRole('admin', 'gerant'), controller.createProduit);
router.put('/produits/:id', auth, requireRole('admin', 'gerant'), controller.updateProduit);
router.delete('/produits/:id', auth, requireRole('admin', 'gerant'), controller.deleteProduit);

module.exports = router;
