// =====================================================================
// Contrôleur du dashboard — statistiques pour l'administrateur / gérant
// =====================================================================
const { pool } = require('../config/db');

// GET /api/dashboard/stats
async function getStats(req, res) {
  const restaurantId = req.user.restaurant_id;

  try {
    const [[caJour]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM orders
       WHERE restaurant_id = ? AND DATE(created_at) = CURDATE() AND statut != 'annulee'`,
      [restaurantId]
    );

    const [[caMois]] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM orders
       WHERE restaurant_id = ? AND YEAR(created_at) = YEAR(CURDATE())
       AND MONTH(created_at) = MONTH(CURDATE()) AND statut != 'annulee'`,
      [restaurantId]
    );

    const [[nbCommandes]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()`,
      [restaurantId]
    );

    const [[nbClients]] = await pool.query(
      `SELECT COUNT(DISTINCT table_id) AS total FROM orders
       WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()`,
      [restaurantId]
    );

    const [produitPopulaire] = await pool.query(
      `SELECT p.nom, SUM(oi.quantite) AS quantite_vendue
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.restaurant_id = ? AND o.statut != 'annulee'
       GROUP BY p.id ORDER BY quantite_vendue DESC LIMIT 5`,
      [restaurantId]
    );

    const [ventesParJour] = await pool.query(
      `SELECT DATE(created_at) AS jour, SUM(total) AS total FROM orders
       WHERE restaurant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       AND statut != 'annulee' GROUP BY DATE(created_at) ORDER BY jour ASC`,
      [restaurantId]
    );

    res.json({
      chiffre_affaires_jour: caJour.total,
      chiffre_affaires_mois: caMois.total,
      nombre_commandes_jour: nbCommandes.total,
      nombre_clients_jour: nbClients.total,
      produits_populaires: produitPopulaire,
      ventes_7_derniers_jours: ventesParJour,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques.' });
  }
}

module.exports = { getStats };
