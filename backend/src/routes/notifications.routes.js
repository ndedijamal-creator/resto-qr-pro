// =====================================================================
// Routes des notifications
// =====================================================================
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/notifications.controller');

router.post('/call-waiter', controller.callWaiter);

router.get('/', auth, controller.getNotifications);
router.patch('/:id/lue', auth, controller.markAsRead);

module.exports = router;
