// =====================================================================
// Routes d'authentification
// =====================================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/reset-password/:token/verify', authController.checkResetToken);

module.exports = router;
