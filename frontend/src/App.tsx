// =====================================================================
// Routeur principal de RESTO QR PRO
// =====================================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import SetPassword from './pages/auth/SetPassword';
import Menu from './pages/client/Menu';
import Cart from './pages/client/Cart';
import OrderTracking from './pages/client/OrderTracking';
import Dashboard from './pages/admin/Dashboard';
import Tables from './pages/admin/Tables';
import MenuManagement from './pages/admin/MenuManagement';
import Staff from './pages/admin/Staff';
import Kitchen from './pages/kitchen/Kitchen';
import ServerView from './pages/server/ServerView';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Accueil -> redirige vers la connexion du personnel */}
          <Route path="/" element={<Navigate to="/connexion" replace />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/definir-mot-de-passe/:token" element={<SetPassword />} />

          {/* Parcours client (accessible via le QR Code de la table) */}
          <Route path="/table/:code" element={<Menu />} />
          <Route path="/table/:code/panier" element={<Cart />} />
          <Route path="/table/:code/suivi/:orderId" element={<OrderTracking />} />

          {/* Espace administrateur / gérant */}
          <Route
            path="/admin/tableau-de-bord"
            element={
              <ProtectedRoute rolesAutorises={['admin', 'gerant']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tables"
            element={
              <ProtectedRoute rolesAutorises={['admin', 'gerant']}>
                <Tables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <ProtectedRoute rolesAutorises={['admin', 'gerant']}>
                <MenuManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/personnel"
            element={
              <ProtectedRoute rolesAutorises={['admin']}>
                <Staff />
              </ProtectedRoute>
            }
          />

          {/* Espace cuisine */}
          <Route
            path="/cuisine"
            element={
              <ProtectedRoute rolesAutorises={['cuisinier']}>
                <Kitchen />
              </ProtectedRoute>
            }
          />

          {/* Espace serveur */}
          <Route
            path="/serveur"
            element={
              <ProtectedRoute rolesAutorises={['serveur']}>
                <ServerView />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
