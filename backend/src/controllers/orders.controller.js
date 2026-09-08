// =====================================================================
// Contrôleur de gestion des commandes
// États possibles : en_attente -> confirmee -> en_preparation -> prete -> servie
//                    (ou annulee à tout moment avant "servie")
// =====================================================================
const { pool } = require('../config/db');
const { emitToRestaurant, emitToTable } = require('../sockets/socket');

// POST /api/orders — le client passe une commande depuis sa table (public)
// Body attendu : { table_id, items: [{ product_id, quantite, remarque }], note_client, methode_paiement }
const METHODES_PAIEMENT_VALIDES = ['especes', 'carte', 'mobile_money'];

async function createOrder(req, res) {
  const { table_id, items, note_client, methode_paiement } = req.body;

  if (!table_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'La commande doit contenir au moins un article.' });
  }

  const methodePaiementFinale = METHODES_PAIEMENT_VALIDES.includes(methode_paiement)
    ? methode_paiement
    : 'especes';

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Récupère le restaurant lié à la table + vérifie sa validité
    const [tableRows] = await connection.query(
      'SELECT restaurant_id FROM restaurant_tables WHERE id = ?',
      [table_id]
    );
    if (tableRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Table introuvable.' });
    }
    const restaurantId = tableRows[0].restaurant_id;

    // Récupère les prix actuels des produits (ne jamais faire confiance au prix envoyé par le client)
    const productIds = items.map((i) => i.product_id);
    const [produits] = await connection.query(
      `SELECT id, prix, disponible FROM products WHERE id IN (?) AND restaurant_id = ?`,
      [productIds, restaurantId]
    );

    if (produits.length !== productIds.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'Un ou plusieurs produits sont invalides.' });
    }

    const produitIndispo = produits.find((p) => !p.disponible);
    if (produitIndispo) {
      await connection.rollback();
      return res.status(400).json({ message: 'Un produit sélectionné n\'est plus disponible.' });
    }

    let total = 0;
    const lignes = items.map((item) => {
      const produit = produits.find((p) => p.id === item.product_id);
      const sousTotal = Number(produit.prix) * item.quantite;
      total += sousTotal;
      return { ...item, prix_unitaire: produit.prix, sous_total: sousTotal };
    });

    // La commande passe directement en "confirmee" : sur ce type de plateforme
    // (commande depuis la table via QR Code), il n'y a pas d'étape manuelle de
    // validation par un employé — la commande doit apparaître immédiatement
    // en cuisine dès qu'elle est envoyée par le client.
    const [orderResult] = await connection.query(
      `INSERT INTO orders (restaurant_id, table_id, statut, total, note_client) VALUES (?, ?, 'confirmee', ?, ?)`,
      [restaurantId, table_id, total, note_client || null]
    );
    const orderId = orderResult.insertId;

    for (const ligne of lignes) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantite, prix_unitaire, sous_total, remarque)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, ligne.product_id, ligne.quantite, ligne.prix_unitaire, ligne.sous_total, ligne.remarque || null]
      );
    }

    // La table passe automatiquement en "occupée"
    await connection.query(`UPDATE restaurant_tables SET statut = 'occupee' WHERE id = ?`, [table_id]);

    // Enregistre le mode de paiement choisi par le client (encaissement
    // effectif géré ensuite par le personnel — voir module paiements)
    await connection.query(
      `INSERT INTO payments (order_id, montant, methode, statut) VALUES (?, ?, ?, 'en_attente')`,
      [orderId, total, methodePaiementFinale]
    );

    await connection.commit();

    const commandeComplete = await getOrderWithItems(orderId);

    // Notifie en temps réel le personnel du restaurant (cuisine, serveurs, dashboard)
    emitToRestaurant(restaurantId, 'nouvelle_commande', commandeComplete);

    res.status(201).json({ message: 'Commande enregistrée.', order: commandeComplete });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande.' });
  } finally {
    connection.release();
  }
}

async function getOrderWithItems(orderId) {
  const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  const [items] = await pool.query(
    `SELECT oi.*, p.nom AS produit_nom FROM order_items oi
     JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
    [orderId]
  );
  return { ...order, items };
}

// GET /api/orders — liste des commandes du restaurant (staff), filtrable par statut
async function getOrders(req, res) {
  const { statut } = req.query;
  try {
    let query = `SELECT o.*, t.numero AS table_numero FROM orders o
                 JOIN restaurant_tables t ON t.id = o.table_id
                 WHERE o.restaurant_id = ?`;
    const params = [req.user.restaurant_id];

    if (statut) {
      query += ' AND o.statut = ?';
      params.push(statut);
    }
    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.query(query, params);

    // Récupère les articles pour chaque commande
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.nom AS produit_nom FROM order_items oi
         JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes.' });
  }
}

// GET /api/orders/:id/track — suivi public d'une commande (client)
async function trackOrder(req, res) {
  try {
    const commande = await getOrderWithItems(req.params.id);
    if (!commande.id) return res.status(404).json({ message: 'Commande introuvable.' });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// PATCH /api/orders/:id/statut — changement de statut (cuisine, serveur, gérant)
// Body : { statut: 'confirmee' | 'en_preparation' | 'prete' | 'servie' | 'annulee' }
const STATUTS_VALIDES = ['en_attente', 'confirmee', 'en_preparation', 'prete', 'servie', 'annulee'];

async function updateOrderStatus(req, res) {
  const { statut } = req.body;

  if (!STATUTS_VALIDES.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }

  try {
    const [[order]] = await pool.query('SELECT * FROM orders WHERE id = ? AND restaurant_id = ?', [
      req.params.id,
      req.user.restaurant_id,
    ]);

    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });

    await pool.query('UPDATE orders SET statut = ? WHERE id = ?', [statut, req.params.id]);

    const commandeMaj = await getOrderWithItems(req.params.id);

    // Diffuse la mise à jour au personnel ET au client concerné (suivi en direct)
    emitToRestaurant(req.user.restaurant_id, 'commande_maj', commandeMaj);
    emitToTable(order.table_id, 'commande_maj', commandeMaj);

    // Si la commande est servie, la table redevient libre
    if (statut === 'servie') {
      await pool.query(`UPDATE restaurant_tables SET statut = 'libre' WHERE id = ?`, [order.table_id]);
    }

    res.json({ message: 'Statut mis à jour.', order: commandeMaj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut.' });
  }
}

module.exports = { createOrder, getOrders, trackOrder, updateOrderStatus };
