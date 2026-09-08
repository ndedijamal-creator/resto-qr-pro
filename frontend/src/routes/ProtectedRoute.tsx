// =====================================================================
// Protège une route : redirige vers /connexion si non authentifié,
// et vérifie éventuellement que le rôle de l'utilisateur est autorisé.
// =====================================================================
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

export default function ProtectedRoute({
  children,
  rolesAutorises,
}: {
  children: JSX.Element;
  rolesAutorises?: Role[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-ink/50">
        Chargement…
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace />;

  if (rolesAutorises && !rolesAutorises.includes(user.role)) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}
