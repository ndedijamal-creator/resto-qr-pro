// =====================================================================
// Utilitaires de gestion des tokens JWT (génération / vérification)
// =====================================================================
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Génère un token d'accès signé, contenant l'identité et le rôle de l'utilisateur.
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      restaurant_id: user.restaurant_id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

/**
 * Génère un token de rafraîchissement à durée de vie plus longue.
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
