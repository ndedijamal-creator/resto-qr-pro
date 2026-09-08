// =====================================================================
// Contrôleur de gestion du menu — catégories et produits
// =====================================================================
const { pool } = require('../config/db');

// GET /api/menu — menu complet groupé par catégories (usage client + admin)
async function getMenu(req, res) {
  // restaurant_id peut venir soit du token (staff), soit d'un paramètre
  // public (client ayant scanné un QR code)
  const restaurantId = req.user ? req.user.restaurant_id : req.query.restaurant_id;

  if (!restaurantId) {
    return res.status(400).json({ message: 'restaurant_id requis.' });
  }

  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY ordre_affichage ASC',
      [restaurantId]
    );

    const [produits] = await pool.query(
      `SELECT * FROM products WHERE restaurant_id = ? ORDER BY nom ASC`,
      [restaurantId]
    );

    const menu = categories.map((cat) => ({
      ...cat,
      produits: produits.filter((p) => p.category_id === cat.id),
    }));

    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du menu.' });
  }
}

// ---- Catégories -------------------------------------------------------

async function createCategorie(req, res) {
  const { nom, ordre_affichage } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO categories (restaurant_id, nom, ordre_affichage) VALUES (?, ?, ?)',
      [req.user.restaurant_id, nom, ordre_affichage || 0]
    );
    res.status(201).json({ id: result.insertId, nom, ordre_affichage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
  }
}

async function deleteCategorie(req, res) {
  try {
    await pool.query('DELETE FROM categories WHERE id = ? AND restaurant_id = ?', [
      req.params.id,
      req.user.restaurant_id,
    ]);
    res.json({ message: 'Catégorie supprimée.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

// ---- Produits -----------------------------------------------------------

async function createProduit(req, res) {
  const { category_id, nom, description, prix, photo_url, disponible } = req.body;

  if (!nom || !prix || !category_id) {
    return res.status(400).json({ message: 'Nom, prix et catégorie sont obligatoires.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO products (restaurant_id, category_id, nom, description, prix, photo_url, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.restaurant_id,
        category_id,
        nom,
        description || null,
        prix,
        photo_url || null,
        disponible === undefined ? true : disponible,
      ]
    );
    res.status(201).json({ id: result.insertId, message: 'Produit créé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du produit.' });
  }
}

async function updateProduit(req, res) {
  const { nom, description, prix, photo_url, disponible, category_id } = req.body;
  try {
    await pool.query(
      `UPDATE products SET
        nom = COALESCE(?, nom),
        description = COALESCE(?, description),
        prix = COALESCE(?, prix),
        photo_url = COALESCE(?, photo_url),
        disponible = COALESCE(?, disponible),
        category_id = COALESCE(?, category_id)
       WHERE id = ? AND restaurant_id = ?`,
      [nom, description, prix, photo_url, disponible, category_id, req.params.id, req.user.restaurant_id]
    );
    res.json({ message: 'Produit mis à jour.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
}

async function deleteProduit(req, res) {
  try {
    await pool.query('DELETE FROM products WHERE id = ? AND restaurant_id = ?', [
      req.params.id,
      req.user.restaurant_id,
    ]);
    res.json({ message: 'Produit supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

module.exports = {
  getMenu,
  createCategorie,
  deleteCategorie,
  createProduit,
  updateProduit,
  deleteProduit,
};
