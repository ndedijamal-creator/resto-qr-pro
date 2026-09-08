// =====================================================================
// Contrôleur de gestion du personnel (staff)
//
// Principe : l'administrateur crée un compte avec juste un nom, un email
// et un rôle — sans définir de mot de passe. Le système génère un lien
// sécurisé à usage unique que l'admin transmet à l'employé (SMS, WhatsApp,
// en main propre...). L'employé ouvre ce lien et choisit lui-même son
// mot de passe. Ça évite d'avoir à configurer un vrai serveur d'email
// pour une mise en route rapide, tout en gardant chacun responsable de
// son propre mot de passe.
// =====================================================================
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// GET /api/users — liste du personnel du restaurant
async function getUsers(req, res) {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.nom_complet, u.email, u.actif, u.created_at, r.nom AS role,
              (u.reset_token IS NOT NULL AND u.reset_token_exp > NOW()) AS en_attente_activation
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.restaurant_id = ?
       ORDER BY u.created_at DESC`,
      [req.user.restaurant_id]
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du personnel.' });
  }
}

// POST /api/users — créer un employé (admin uniquement)
// Body : { nom_complet, email, role }
async function createUser(req, res) {
  const { nom_complet, email, role } = req.body;
  const ROLES_VALIDES = ['admin', 'gerant', 'serveur', 'cuisinier'];

  if (!nom_complet || !email || !ROLES_VALIDES.includes(role)) {
    return res.status(400).json({ message: 'Nom, email et rôle valide sont obligatoires.' });
  }

  try {
    const [existant] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existant.length > 0) {
      return res.status(409).json({ message: 'Un compte existe déjà avec cet email.' });
    }

    const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE nom = ?', [role]);

    // Mot de passe temporaire aléatoire (inaccessible) : l'employé doit
    // obligatoirement passer par le lien de définition pour se connecter.
    const motDePasseTemporaire = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const [result] = await pool.query(
      `INSERT INTO users (restaurant_id, role_id, nom_complet, email, mot_de_passe, reset_token, reset_token_exp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.restaurant_id, roleRow.id, nom_complet, email, motDePasseTemporaire, token, expiration]
    );

    const lienActivation = `${process.env.FRONTEND_URL}/definir-mot-de-passe/${token}`;

    res.status(201).json({
      message: 'Compte créé. Transmettez ce lien à la personne pour qu\'elle choisisse son mot de passe.',
      id: result.insertId,
      lienActivation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de l'employé." });
  }
}

// POST /api/users/:id/renvoyer-lien — regénère un lien d'activation (mot de passe oublié / lien expiré)
async function renewActivationLink(req, res) {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [result] = await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE id = ? AND restaurant_id = ?',
      [token, expiration, req.params.id, req.user.restaurant_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employé introuvable.' });
    }

    res.json({ lienActivation: `${process.env.FRONTEND_URL}/definir-mot-de-passe/${token}` });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// PATCH /api/users/:id — activer/désactiver un compte
async function toggleActif(req, res) {
  try {
    await pool.query(
      'UPDATE users SET actif = NOT actif WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.user.restaurant_id]
    );
    res.json({ message: 'Statut mis à jour.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
  }
  try {
    await pool.query('DELETE FROM users WHERE id = ? AND restaurant_id = ?', [
      req.params.id,
      req.user.restaurant_id,
    ]);
    res.json({ message: 'Employé supprimé.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

module.exports = { getUsers, createUser, renewActivationLink, toggleActif, deleteUser };
