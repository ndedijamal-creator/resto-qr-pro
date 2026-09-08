// =====================================================================
// Middleware d'authentification — vérifie le token JWT dans l'en-tête
// Authorization: Bearer <token>
// =====================================================================
const { verifyAccessToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authentification requise." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    // On attache les infos de l'utilisateur à la requête pour les
    // contrôleurs / middlewares suivants (ex: vérification des rôles)
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
}

module.exports = authMiddleware;
