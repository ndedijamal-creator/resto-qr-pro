// =====================================================================
// Gestion du personnel — l'admin crée un compte (nom, email, rôle) et
// obtient un lien à transmettre à l'employé, qui choisit lui-même son
// mot de passe en l'ouvrant.
// =====================================================================
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StaffLayout from '../../components/StaffLayout';
import type { Role } from '../../types';
import { UserPlus, Copy, Check, RefreshCw, Trash2, Power } from 'lucide-react';

interface Employe {
  id: number;
  nom_complet: string;
  email: string;
  role: Role;
  actif: boolean;
  en_attente_activation: number | boolean;
}

const LABELS_ROLE: Record<Role, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  serveur: 'Serveur',
  cuisinier: 'Cuisinier',
};

export default function Staff() {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [form, setForm] = useState({ nom_complet: '', email: '', role: 'serveur' as Role });
  const [lienGenere, setLienGenere] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState('');

  async function charger() {
    const { data } = await api.get('/users');
    setEmployes(data);
  }

  useEffect(() => {
    charger();
  }, []);

  async function creerEmploye(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    try {
      const { data } = await api.post('/users', form);
      setLienGenere(data.lienActivation);
      setForm({ nom_complet: '', email: '', role: 'serveur' });
      charger();
    } catch (err: any) {
      setErreur(err?.response?.data?.message || 'Erreur lors de la création.');
    }
  }

  async function renvoyerLien(id: number) {
    const { data } = await api.post(`/users/${id}/renvoyer-lien`);
    setLienGenere(data.lienActivation);
  }

  async function copierLien() {
    if (!lienGenere) return;
    await navigator.clipboard.writeText(lienGenere);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  async function toggleActif(id: number) {
    await api.patch(`/users/${id}/actif`);
    charger();
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer définitivement ce compte ?')) return;
    await api.delete(`/users/${id}`);
    charger();
  }

  return (
    <StaffLayout titre="Personnel">
      <form onSubmit={creerEmploye} className="mb-6 flex items-end gap-3 rounded-xl2 bg-surface p-5 shadow-card">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink/60">Nom complet</label>
          <input
            required
            value={form.nom_complet}
            onChange={(e) => setForm({ ...form, nom_complet: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Ex : Marie Ngo"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-ink/60">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="marie@resto.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Rôle</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="serveur">Serveur</option>
            <option value="cuisinier">Cuisinier</option>
            <option value="gerant">Gérant</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          <UserPlus size={16} /> Créer
        </button>
      </form>

      {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

      {lienGenere && (
        <div className="mb-6 rounded-xl2 bg-primary-50 p-4">
          <p className="mb-2 text-sm font-medium text-primary-700">
            Compte créé ! Transmettez ce lien à la personne pour qu'elle choisisse son mot de passe :
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-ink/70">{lienGenere}</code>
            <button
              onClick={copierLien}
              className="flex items-center gap-1 rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white"
            >
              {copie ? <Check size={13} /> : <Copy size={13} />}
              {copie ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl2 bg-surface shadow-card">
        {employes.map((employe) => (
          <div
            key={employe.id}
            className="flex items-center justify-between border-b border-black/5 px-5 py-3 last:border-none"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{employe.nom_complet}</p>
              <p className="text-xs text-ink/40">
                {employe.email} · {LABELS_ROLE[employe.role]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {employe.en_attente_activation ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  En attente d'activation
                </span>
              ) : (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    employe.actif ? 'bg-green-50 text-green-700' : 'bg-black/5 text-ink/40'
                  }`}
                >
                  {employe.actif ? 'Actif' : 'Désactivé'}
                </span>
              )}
              {employe.en_attente_activation ? (
                <button
                  onClick={() => renvoyerLien(employe.id)}
                  title="Renvoyer/regénérer le lien"
                  className="rounded-lg border border-black/10 p-1.5 text-ink/50 hover:bg-black/5"
                >
                  <RefreshCw size={14} />
                </button>
              ) : (
                <button
                  onClick={() => toggleActif(employe.id)}
                  title={employe.actif ? 'Désactiver' : 'Activer'}
                  className="rounded-lg border border-black/10 p-1.5 text-ink/50 hover:bg-black/5"
                >
                  <Power size={14} />
                </button>
              )}
              <button
                onClick={() => supprimer(employe.id)}
                className="rounded-lg border border-black/10 p-1.5 text-ink/50 hover:border-red-200 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </StaffLayout>
  );
}
