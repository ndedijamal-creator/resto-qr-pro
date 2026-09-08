// =====================================================================
// Contrôleur d'authentification : connexion, déconnexion,
// réinitialisation de mot de passe
// =====================================================================
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// ---------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------
async function login(req, res) {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT u.*, r.nom AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? AND u.actif = TRUE`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const utilisateur = rows[0];
    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);

    if (!motDePasseValide) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const payload = {
      id: utilisateur.id,
      restaurant_id: utilisateur.restaurant_id,
      role: utilisateur.role,
      email: utilisateur.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      message: 'Connexion réussie.',
      accessToken,
      refreshToken,
      user: {
        id: utilisateur.id,
        nom_complet: utilisateur.nom_complet,
        email: utilisateur.email,
        role: utilisateur.role,
        restaurant_id: utilisateur.restaurant_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token manquant.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const [rows] = await pool.query(
      `SELECT u.*, r.nom AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    const utilisateur = rows[0];
    const accessToken = generateAccessToken({
      id: utilisateur.id,
      restaurant_id: utilisateur.restaurant_id,
      role: utilisateur.role,
      email: utilisateur.email,
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Refresh token invalide ou expiré.' });
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/logout
// Côté stateless JWT, la déconnexion est gérée par la suppression du
// token côté client. On garde cet endpoint pour une éventuelle liste
// noire de tokens ou pour la cohérence de l'API.
// ---------------------------------------------------------------------
async function logout(req, res) {
  res.json({ message: 'Déconnexion réussie.' });
}

// ---------------------------------------------------------------------
// POST /api/auth/forgot-password
// Génère un token de réinitialisation et l'enregistre en base.
// L'envoi d'email réel doit être branché via utils/mailer (SMTP).
// ---------------------------------------------------------------------
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Pour éviter l'énumération des comptes, on répond toujours succès.
      return res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_exp = ? WHERE email = ?',
      [token, expiration, email]
    );

    // TODO : envoyer l'email contenant le lien de réinitialisation
    // via un service SMTP (voir utils/mailer.js à implémenter)

    res.json({ message: 'Si ce compte existe, un email a été envoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------
async function resetPassword(req, res) {
  const { token, nouveau_mot_de_passe } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_exp > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré.' });
    }

    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query(
      'UPDATE users SET mot_de_passe = ?, reset_token = NULL, reset_token_exp = NULL WHERE id = ?',
      [hash, rows[0].id]
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// ---------------------------------------------------------------------
// GET /api/auth/reset-password/:token/verify
// Vérifie qu'un lien de définition de mot de passe est valide (utilisé
// à la fois pour "mot de passe oublié" et pour la première connexion
// d'un nouvel employé).
// ---------------------------------------------------------------------
async function checkResetToken(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT email, nom_complet FROM users WHERE reset_token = ? AND reset_token_exp > NOW()',
      [req.params.token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ valide: false, message: 'Lien invalide ou expiré.' });
    }

    res.json({ valide: true, email: rows[0].email, nom_complet: rows[0].nom_complet });
  } catch (error) {
    res.status(500).json({ valide: false, message: 'Erreur serveur.' });
  }
}

module.exports = { login, refresh, logout, forgotPassword, resetPassword, checkResetToken };
