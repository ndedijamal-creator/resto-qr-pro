// =====================================================================
// Layout commun aux interfaces du personnel : barre latérale de
// navigation + zone de contenu principale.
// =====================================================================
import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Table2,
  UtensilsCrossed,
  ChefHat,
  Bell,
  LogOut,
  Users,
} from 'lucide-react';

const LIENS = [
  { to: '/admin/tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['admin', 'gerant'] },
  { to: '/admin/tables', label: 'Tables', icon: Table2, roles: ['admin', 'gerant'] },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, roles: ['admin', 'gerant'] },
  { to: '/admin/personnel', label: 'Personnel', icon: Users, roles: ['admin'] },
  { to: '/cuisine', label: 'Cuisine', icon: ChefHat, roles: ['cuisinier'] },
  { to: '/serveur', label: 'Service', icon: Bell, roles: ['serveur'] },
];

export default function StaffLayout({ children, titre }: { children: ReactNode; titre: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const liensVisibles = LIENS.filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="flex w-60 flex-shrink-0 flex-col border-r border-black/5 bg-surface px-4 py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            R
          </div>
          <span className="font-display text-sm font-bold text-ink">RESTO QR PRO</span>
        </div>

        <nav className="flex-1 space-y-1">
          {liensVisibles.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-ink/60 hover:bg-black/5'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-black/5 pt-4">
          <p className="px-2 text-xs font-medium text-ink/40">{user?.nom_complet}</p>
          <p className="px-2 text-xs text-ink/30">{user?.role}</p>
          <button
            onClick={() => {
              logout();
              navigate('/connexion');
            }}
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink/50 hover:bg-black/5"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="border-b border-black/5 bg-surface px-8 py-5">
          <h1 className="text-lg font-bold text-ink">{titre}</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
