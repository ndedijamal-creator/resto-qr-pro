// =====================================================================
// Interface Serveur — voit les commandes prêtes à servir, les appels
// des clients (avec alerte sonore + notification système), et un
// récapitulatif de tout ce qui a été servi dans la journée.
// =====================================================================
import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import StaffLayout from '../../components/StaffLayout';
import { useRestaurantSocket } from '../../hooks/useRestaurantSocket';
import { jouerAlerte, notifierSysteme } from '../../utils/notifications';
import type { Order, Notification } from '../../types';
import { UtensilsCrossed, Bell, Volume2, VolumeX, ClipboardList } from 'lucide-react';

export default function ServerView() {
  const [commandesPretes, setCommandesPretes] = useState<Order[]>([]);
  const [commandesServies, setCommandesServies] = useState<Order[]>([]);
  const [appels, setAppels] = useState<Notification[]>([]);
  const [sonActif, setSonActif] = useState(true);
  const nombreAppelsRef = useRef(0);

  async function chargerCommandes() {
    const { data: pretes } = await api.get('/orders', { params: { statut: 'prete' } });
    setCommandesPretes(pretes);

    const { data: servies } = await api.get('/orders', { params: { statut: 'servie' } });
    const aujourdHui = new Date().toDateString();
    setCommandesServies(servies.filter((o: Order) => new Date(o.created_at).toDateString() === aujourdHui));
  }

  async function chargerNotifications(estUnRafraichissementSilencieux = false) {
    const { data } = await api.get('/notifications');
    const nonLues: Notification[] = data.filter((n: Notification) => n.type === 'appel_serveur' && !n.lue);

    if (estUnRafraichissementSilencieux && nonLues.length > nombreAppelsRef.current && sonActif) {
      jouerAlerte(660);
    }
    nombreAppelsRef.current = nonLues.length;
    setAppels(nonLues);
  }

  useEffect(() => {
    chargerCommandes();
    chargerNotifications();
    // Filet de sécurité : re-synchronise toutes les 20s en complément du temps réel
    const intervalle = setInterval(() => {
      chargerCommandes();
      chargerNotifications(true);
    }, 20000);
    return () => clearInterval(intervalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonActif]);

  useRestaurantSocket({
    onCommandeMaj: (payload: Order) => {
      chargerCommandes();
      // Alerte active le serveur dès qu'une commande passe "prête" en cuisine —
      // il ne doit pas avoir à surveiller l'écran en permanence.
      if (payload.statut === 'prete') {
        if (sonActif) jouerAlerte(990);
        notifierSysteme('Commande prête à servir', `Table ${payload.table_numero} — commande n°${payload.id}`);
      }
    },
    onNotification: (payload: Notification) => {
      if (sonActif) jouerAlerte(660);
      notifierSysteme('Un client vous appelle', payload.message);
      chargerNotifications();
    },
  });

  async function servir(id: number) {
    await api.patch(`/orders/${id}/statut`, { statut: 'servie' });
    chargerCommandes();
  }

  async function marquerAppelTraite(id: number) {
    await api.patch(`/notifications/${id}/lue`);
    chargerNotifications();
  }

  const totalServiJour = commandesServies.reduce((somme, o) => somme + Number(o.total), 0);

  return (
    <StaffLayout titre="Service en salle">
      {/* Résumé de la journée */}
      <div className="mb-6 flex items-center justify-between rounded-xl2 bg-surface p-4 shadow-card">
        <div className="flex gap-8">
          <div>
            <p className="text-xs font-medium text-ink/50">Commandes servies aujourd'hui</p>
            <p className="text-xl font-bold text-ink">{commandesServies.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink/50">Total encaissé (estimé)</p>
            <p className="text-xl font-bold text-primary">{totalServiJour.toLocaleString()} XAF</p>
          </div>
        </div>
        <button
          onClick={() => setSonActif((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-ink/60 hover:bg-black/5"
        >
          {sonActif ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {sonActif ? 'Son activé' : 'Son coupé'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Commandes prêtes */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/70">
            <UtensilsCrossed size={16} /> Prêtes à servir
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{commandesPretes.length}</span>
          </h2>
          <div className="space-y-3">
            {commandesPretes.length === 0 && (
              <p className="rounded-xl2 border border-dashed border-black/10 p-6 text-center text-xs text-ink/30">
                Rien pour l'instant
              </p>
            )}
            {commandesPretes.map((commande) => (
              <div key={commande.id} className="rounded-xl2 bg-surface p-4 shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">Table {commande.table_numero}</span>
                  <span className="text-xs text-ink/40">#{commande.id}</span>
                </div>
                <ul className="mb-3 space-y-1 text-sm text-ink/70">
                  {commande.items.map((item) => (
                    <li key={item.id}>
                      {item.quantite} × {item.produit_nom}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => servir(commande.id)}
                  className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white hover:bg-primary-600"
                >
                  Marquer comme servie
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Appels clients */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/70">
            <Bell size={16} /> Appels des clients
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{appels.length}</span>
          </h2>
          <div className="space-y-3">
            {appels.length === 0 && (
              <p className="rounded-xl2 border border-dashed border-black/10 p-6 text-center text-xs text-ink/30">
                Aucun appel en attente
              </p>
            )}
            {appels.map((appel) => (
              <div key={appel.id} className="flex items-center justify-between rounded-xl2 bg-surface p-4 shadow-card">
                <div>
                  <p className="text-sm font-semibold text-ink">{appel.message}</p>
                  <p className="text-xs text-ink/40">{new Date(appel.created_at).toLocaleTimeString('fr-FR')}</p>
                </div>
                <button
                  onClick={() => marquerAppelTraite(appel.id)}
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
                >
                  Traité
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Récapitulatif du service */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink/70">
            <ClipboardList size={16} /> Récapitulatif du service
          </h2>
          <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-xl2 bg-surface p-2 shadow-card">
            {commandesServies.length === 0 && (
              <p className="p-4 text-center text-xs text-ink/30">Rien de servi pour l'instant aujourd'hui</p>
            )}
            {commandesServies
              .slice()
              .reverse()
              .map((commande) => (
                <div key={commande.id} className="rounded-lg border border-black/5 p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">Table {commande.table_numero}</span>
                    <span className="text-ink/40">
                      {new Date(commande.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-ink/50">
                    {commande.items.reduce((s, i) => s + i.quantite, 0)} article(s) · {Number(commande.total).toLocaleString()} XAF
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
