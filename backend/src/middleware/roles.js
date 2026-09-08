// =====================================================================
// Middleware de gestion des rôles — restreint l'accès à certaines
// routes en fonction du rôle de l'utilisateur connecté.
//
// Utilisation : router.get('/route', auth, requireRole('admin', 'gerant'), handler)
// =====================================================================

function requireRole(...rolesAutorises) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentification requise.' });
    }

    if (!rolesAutorises.includes(req.user.role)) {
      return res.status(403).json({
        message: "Accès refusé : vous n'avez pas les droits nécessaires.",
      });
    }

    next();
  };
}

module.exports = requireRole;
