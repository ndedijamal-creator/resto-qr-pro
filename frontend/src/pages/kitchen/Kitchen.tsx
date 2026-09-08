// =====================================================================
// Interface Cuisine — le cuisinier voit les nouvelles commandes, celles
// en préparation, et peut faire progresser ou annuler leur statut.
// Inclut : chrono par commande (avec alerte visuelle si ça traîne),
// alerte sonore à l'arrivée d'une nouvelle commande, résumé en tête
// d'écran, et un rafraîchissement automatique de secours toutes les
// 20 secondes en complément du temps réel.
// =====================================================================
import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import StaffLayout from '../../components/StaffLayout';
import { useRestaurantSocket } from '../../hooks/useRestaurantSocket';
import { jouerAlerte, notifierSysteme } from '../../utils/notifications';
import type { Order } from '../../types';
import { Clock, ChefHat, CheckCircle2, XCircle, UtensilsCrossed, Volume2, VolumeX } from 'lucide-react';

const COLONNES: { statut: Order['statut']; titre: string; suivant: Order['statut'] | null; actionLabel: string }[] = [
  { statut: 'confirmee', titre: 'Nouvelles commandes', suivant: 'en_preparation', actionLabel: 'Commencer la préparation' },
  { statut: 'en_preparation', titre: 'En préparation', suivant: 'prete', actionLabel: 'Marquer comme prête' },
  { statut: 'prete', titre: 'Prêtes', suivant: null, actionLabel: '' },
];

function calculerAnciennete(dateCreation: string, maintenant: number) {
  const minutes = Math.floor((maintenant - new Date(dateCreation).getTime()) / 60000);
  return minutes;
}

function couleurChrono(minutes: number) {
  if (minutes >= 15) return 'bg-red-50 text-red-600';
  if (minutes >= 8) return 'bg-amber-50 text-amber-700';
  return 'bg-green-50 text-green-700';
}

export default function Kitchen() {
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [maintenant, setMaintenant] = useState(Date.now());
  const [sonActif, setSonActif] = useState(true);
  const nombreCommandesRef = useRef(0);

  async function charger(estUnRafraichissementSilencieux = false) {
    const { data } = await api.get('/orders');
    const actives = data.filter((o: Order) => ['confirmee', 'en_preparation', 'prete'].includes(o.statut));

    // Si le nombre de commandes actives augmente, on considère qu'une
    // nouvelle commande est arrivée et on joue une alerte sonore.
    if (estUnRafraichissementSilencieux && actives.length > nombreCommandesRef.current && sonActif) {
      jouerAlerte();
    }
    nombreCommandesRef.current = actives.length;
    setCommandes(actives);
  }

  useEffect(() => {
    charger();
    // Filet de sécurité : re-synchronise toutes les 20s même si le
    // temps réel (Socket.IO) rencontre un problème de réseau.
    const intervalle = setInterval(() => charger(true), 20000);
    // Fait avancer le chrono affiché toutes les 30 secondes
    const intervalleChrono = setInterval(() => setMaintenant(Date.now()), 30000);
    return () => {
      clearInterval(intervalle);
      clearInterval(intervalleChrono);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonActif]);

  useRestaurantSocket({
    onNouvelleCommande: (payload: Order) => {
      if (sonActif) jouerAlerte();
      notifierSysteme('Nouvelle commande', `Table ${payload.table_numero} — ${payload.items?.length ?? ''} article(s)`);
      charger();
    },
    onCommandeMaj: () => charger(),
  });

  async function changerStatut(id: number, statut: Order['statut']) {
    await api.patch(`/orders/${id}/statut`, { statut });
    charger();
  }

  async function annulerCommande(id: number) {
    if (!confirm("Annuler cette commande ? Le client en sera informé immédiatement.")) return;
    await changerStatut(id, 'annulee');
  }

  const totalPlatsAPreparer = commandes
    .filter((c) => c.statut !== 'prete')
    .reduce((somme, c) => somme + c.items.reduce((s, i) => s + i.quantite, 0), 0);

  return (
    <StaffLayout titre="Cuisine">
      {/* Résumé en tête d'écran */}
      <div className="mb-6 flex items-center justify-between rounded-xl2 bg-surface p-4 shadow-card">
        <div className="flex gap-8">
          <div>
            <p className="text-xs font-medium text-ink/50">Commandes actives</p>
            <p className="text-xl font-bold text-ink">{commandes.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink/50">Plats à préparer</p>
            <p className="text-xl font-bold text-primary">{totalPlatsAPreparer}</p>
          </div>
        </div>
        <button
          onClick={() => setSonActif((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-ink/60 hover:bg-black/5"
          title="Activer/désactiver l'alerte sonore des nouvelles commandes"
        >
          {sonActif ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {sonActif ? 'Son activé' : 'Son coupé'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {COLONNES.map((colonne) => (
          <div key={colonne.statut}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/70">
              {colonne.statut === 'confirmee' && <Clock size={16} />}
              {colonne.statut === 'en_preparation' && <ChefHat size={16} />}
              {colonne.statut === 'prete' && <CheckCircle2 size={16} />}
              {colonne.titre}
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                {commandes.filter((c) => c.statut === colonne.statut).length}
              </span>
            </h2>

            <div className="space-y-3">
              {commandes.filter((c) => c.statut === colonne.statut).length === 0 && (
                <p className="rounded-xl2 border border-dashed border-black/10 p-6 text-center text-xs text-ink/30">
                  Rien pour l'instant
                </p>
              )}

              {commandes
                .filter((c) => c.statut === colonne.statut)
                .map((commande) => {
                  const minutes = calculerAnciennete(commande.created_at, maintenant);
                  return (
                    <div key={commande.id} className="rounded-xl2 bg-surface p-4 shadow-card">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">Table {commande.table_numero}</span>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${couleurChrono(minutes)}`}>
                            {minutes < 1 ? "à l'instant" : `${minutes} min`}
                          </span>
                          <span className="text-xs text-ink/40">#{commande.id}</span>
                        </div>
                      </div>
                      <ul className="mb-3 space-y-1 text-sm text-ink/70">
                        {commande.items.map((item) => (
                          <li key={item.id}>
                            <span className="font-semibold text-ink">{item.quantite}×</span> {item.produit_nom}
                            {item.remarque && <span className="block text-xs text-primary">↳ {item.remarque}</span>}
                          </li>
                        ))}
                      </ul>
                      {commande.note_client && (
                        <p className="mb-3 rounded-lg bg-primary-50 p-2 text-xs text-primary-700">
                          {commande.note_client}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {colonne.suivant && (
                          <button
                            onClick={() => changerStatut(commande.id, colonne.suivant!)}
                            className="flex-1 rounded-lg bg-ink py-2 text-xs font-semibold text-white hover:bg-black"
                          >
                            {colonne.actionLabel}
                          </button>
                        )}
                        {colonne.statut !== 'prete' && (
                          <button
                            onClick={() => annulerCommande(commande.id)}
                            className="flex items-center justify-center rounded-lg border border-black/10 px-2.5 text-ink/40 hover:border-red-200 hover:text-red-500"
                            title="Annuler la commande"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        {colonne.statut === 'prete' && (
                          <span className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-50 py-2 text-xs font-medium text-green-700">
                            <UtensilsCrossed size={13} /> En attente du serveur
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </StaffLayout>
  );
}
