// =====================================================================
// Contrôleur des notifications — notamment "Appeler un serveur"
// =====================================================================
const { pool } = require('../config/db');
const { emitToRestaurant } = require('../sockets/socket');

// POST /api/notifications/call-waiter — appel public depuis la table du client
async function callWaiter(req, res) {
  const { table_id } = req.body;

  if (!table_id) return res.status(400).json({ message: 'table_id requis.' });

  try {
    const [[table]] = await pool.query(
      'SELECT * FROM restaurant_tables WHERE id = ?',
      [table_id]
    );
    if (!table) return res.status(404).json({ message: 'Table introuvable.' });

    const message = `La table ${table.numero} demande un serveur.`;

    const [result] = await pool.query(
      `INSERT INTO notifications (restaurant_id, table_id, type, message) VALUES (?, ?, 'appel_serveur', ?)`,
      [table.restaurant_id, table_id, message]
    );

    const notification = {
      id: result.insertId,
      restaurant_id: table.restaurant_id,
      table_id,
      table_numero: table.numero,
      type: 'appel_serveur',
      message,
      created_at: new Date(),
    };

    // Notifie immédiatement tout le personnel connecté du restaurant
    emitToRestaurant(table.restaurant_id, 'notification', notification);

    res.status(201).json({ message: 'Le serveur a été prévenu.', notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// GET /api/notifications — liste des notifications du restaurant (staff)
async function getNotifications(req, res) {
  try {
    const [notifications] = await pool.query(
      `SELECT n.*, t.numero AS table_numero FROM notifications n
       LEFT JOIN restaurant_tables t ON t.id = n.table_id
       WHERE n.restaurant_id = ? ORDER BY n.created_at DESC LIMIT 50`,
      [req.user.restaurant_id]
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// PATCH /api/notifications/:id/lue — marquer une notification comme lue
async function markAsRead(req, res) {
  try {
    await pool.query('UPDATE notifications SET lue = TRUE WHERE id = ? AND restaurant_id = ?', [
      req.params.id,
      req.user.restaurant_id,
    ]);
    res.json({ message: 'Notification marquée comme lue.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { callWaiter, getNotifications, markAsRead };
