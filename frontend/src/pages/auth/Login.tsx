// =====================================================================
// Page de connexion — réservée au personnel (admin, gérant, serveur, cuisinier)
// =====================================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const REDIRECTIONS: Record<string, string> = {
  admin: '/admin/tableau-de-bord',
  gerant: '/admin/tableau-de-bord',
  serveur: '/serveur',
  cuisinier: '/cuisine',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await login(email, motDePasse);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(REDIRECTIONS[stored.role] || '/');
    } catch (err: any) {
      setErreur(err?.response?.data?.message || 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
            R
          </div>
          <h1 className="text-2xl font-bold text-white">RESTO QR PRO</h1>
          <p className="mt-1 text-sm text-white/50">Espace personnel du restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl2 bg-surface p-6 shadow-card">
          <label className="mb-1 block text-sm font-medium text-ink/70">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="vous@restaurant.com"
          />

          <label className="mb-1 block text-sm font-medium text-ink/70">Mot de passe</label>
          <div className="relative mb-4">
            <input
              type={afficherMotDePasse ? 'text' : 'password'}
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 pr-10 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setAfficherMotDePasse((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
              tabIndex={-1}
            >
              {afficherMotDePasse ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
