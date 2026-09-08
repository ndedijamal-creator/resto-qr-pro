// =====================================================================
// Tableau de bord administrateur — statistiques clés du restaurant
// =====================================================================
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StaffLayout from '../../components/StaffLayout';
import type { DashboardStats } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) {
    return (
      <StaffLayout titre="Tableau de bord">
        <p className="text-sm text-ink/40">Chargement des statistiques…</p>
      </StaffLayout>
    );
  }

  const cartes = [
    { label: "Chiffre d'affaires — jour", valeur: `${stats.chiffre_affaires_jour.toLocaleString()} XAF`, icon: TrendingUp },
    { label: "Chiffre d'affaires — mois", valeur: `${stats.chiffre_affaires_mois.toLocaleString()} XAF`, icon: Calendar },
    { label: 'Commandes du jour', valeur: stats.nombre_commandes_jour, icon: ShoppingBag },
    { label: 'Clients du jour', valeur: stats.nombre_clients_jour, icon: Users },
  ];

  return (
    <StaffLayout titre="Tableau de bord">
      <div className="mb-8 grid grid-cols-4 gap-4">
        {cartes.map(({ label, valeur, icon: Icon }) => (
          <div key={label} className="rounded-xl2 bg-surface p-5 shadow-card">
            <Icon size={18} className="mb-3 text-primary" />
            <p className="text-xs font-medium text-ink/50">{label}</p>
            <p className="mt-1 text-xl font-bold text-ink">{valeur}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl2 bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-ink/70">Ventes des 7 derniers jours</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.ventes_7_derniers_jours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="jour"
                tickFormatter={(v) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                tick={{ fontSize: 12, fill: '#999' }}
              />
              <YAxis tick={{ fontSize: 12, fill: '#999' }} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} XAF`} />
              <Line type="monotone" dataKey="total" stroke="#ff2e88" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl2 bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-ink/70">Produits les plus vendus</h2>
          <ul className="space-y-3">
            {stats.produits_populaires.map((p, index) => (
              <li key={p.nom} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink/70">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  {p.nom}
                </span>
                <span className="font-semibold text-ink">{p.quantite_vendue}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StaffLayout>
  );
}
