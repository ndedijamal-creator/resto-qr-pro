// =====================================================================
// Page de définition du mot de passe — utilisée à la fois pour la
// première activation d'un compte employé et pour "mot de passe oublié".
// L'employé arrive ici via un lien unique envoyé par l'administrateur.
// =====================================================================
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function SetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [statutToken, setStatutToken] = useState<'chargement' | 'valide' | 'invalide'>('chargement');
  const [infos, setInfos] = useState<{ email: string; nom_complet: string } | null>(null);

  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    api
      .get(`/auth/reset-password/${token}/verify`)
      .then(({ data }) => {
        setInfos({ email: data.email, nom_complet: data.nom_complet });
        setStatutToken('valide');
      })
      .catch(() => setStatutToken('invalide'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');

    if (motDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setEnvoi(true);
    try {
      await api.post('/auth/reset-password', { token, nouveau_mot_de_passe: motDePasse });
      setSucces(true);
      setTimeout(() => navigate('/connexion'), 2500);
    } catch {
      setErreur('Une erreur est survenue. Le lien a peut-être expiré.');
    } finally {
      setEnvoi(false);
    }
  }

  if (statutToken === 'chargement') {
    return <div className="flex min-h-screen items-center justify-center text-ink/40">Vérification du lien…</div>;
  }

  if (statutToken === 'invalide') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4">
        <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 text-center shadow-card">
          <p className="font-semibold text-red-600">Ce lien n'est plus valide.</p>
          <p className="mt-2 text-sm text-ink/50">
            Il a peut-être déjà été utilisé ou a expiré. Demandez à votre administrateur de vous en générer un nouveau.
          </p>
        </div>
      </div>
    );
  }

  if (succes) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4">
        <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 text-center shadow-card">
          <CheckCircle2 className="mx-auto mb-3 text-primary" size={32} />
          <p className="font-semibold text-ink">Mot de passe défini !</p>
          <p className="mt-2 text-sm text-ink/50">Redirection vers la page de connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-white">Bienvenue {infos?.nom_complet} 👋</h1>
          <p className="mt-1 text-sm text-white/50">Choisissez votre mot de passe pour {infos?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl2 bg-surface p-6 shadow-card">
          <label className="mb-1 block text-sm font-medium text-ink/70">Nouveau mot de passe</label>
          <div className="relative mb-4">
            <input
              type={afficherMotDePasse ? 'text' : 'password'}
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 pr-10 text-sm outline-none focus:border-primary"
              placeholder="Au moins 8 caractères"
            />
            <button
              type="button"
              onClick={() => setAfficherMotDePasse((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60"
            >
              {afficherMotDePasse ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <label className="mb-1 block text-sm font-medium text-ink/70">Confirmer le mot de passe</label>
          <input
            type={afficherMotDePasse ? 'text' : 'password'}
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="mb-4 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Retapez le mot de passe"
          />

          {erreur && <p className="mb-4 text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={envoi}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {envoi ? 'Enregistrement…' : 'Définir mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
