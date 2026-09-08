// =====================================================================
// Page de suivi de commande — mise à jour en temps réel via Socket.IO
// =====================================================================
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../../api/axios';
import type { Order, OrderStatus } from '../../types';
import { Check, ChefHat, Clock, PartyPopper, UtensilsCrossed } from 'lucide-react';
import CallWaiterButton from '../../components/CallWaiterButton';

const ETAPES: { statut: OrderStatus; label: string; icon: JSX.Element }[] = [
  { statut: 'confirmee', label: 'Commande reçue', icon: <Check size={18} /> },
  { statut: 'en_preparation', label: 'En préparation', icon: <ChefHat size={18} /> },
  { statut: 'prete', label: 'Prête', icon: <PartyPopper size={18} /> },
  { statut: 'servie', label: 'Servie — bon appétit !', icon: <UtensilsCrossed size={18} /> },
];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function charger() {
      const { data } = await api.get(`/orders/${orderId}/track`);
      setOrder(data);
    }
    charger();

    const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.on('connect', () => {
      if (order?.table_id) socket.emit('join_table', order.table_id);
    });
    socket.on('commande_maj', (maj: Order) => {
      if (String(maj.id) === orderId) setOrder(maj);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!order) {
    return <div className="flex min-h-screen items-center justify-center text-ink/40">Chargement…</div>;
  }

  const etapeActuelle = order.statut === 'en_attente' ? 0 : ETAPES.findIndex((e) => e.statut === order.statut) + 1;
  const annulee = order.statut === 'annulee';

  return (
    <div className="min-h-screen bg-muted px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Commande n°{order.id}</p>
            <h1 className="mt-1 text-xl font-bold text-ink">Suivi de votre commande</h1>
          </div>
          <CallWaiterButton tableId={order.table_id} />
        </div>

        {annulee ? (
          <div className="rounded-xl2 bg-surface p-6 text-center shadow-card">
            <p className="font-semibold text-red-600">Cette commande a été annulée.</p>
            <p className="mt-1 text-sm text-ink/50">Contactez le personnel pour plus d'informations.</p>
          </div>
        ) : (
          <div className="rounded-xl2 bg-surface p-6 shadow-card">
            <div className="space-y-6">
              {ETAPES.map((etape, index) => {
                const atteinte = index < etapeActuelle;
                const active = index === etapeActuelle - 1;
                return (
                  <div key={etape.statut} className="flex items-center gap-4">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        atteinte ? 'bg-primary text-white' : 'bg-muted text-ink/30'
                      }`}
                    >
                      {etape.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${atteinte ? 'text-ink' : 'text-ink/40'}`}>
                        {etape.label}
                      </p>
                      {active && <p className="text-xs text-primary">En cours</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl2 bg-surface p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock size={16} /> Récapitulatif
          </h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-ink/70">
                <span>
                  {item.quantite} × {item.produit_nom}
                </span>
                <span>{item.sous_total.toLocaleString()} XAF</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-sm font-bold text-ink">
            <span>Total</span>
            <span>{order.total.toLocaleString()} XAF</span>
          </div>
        </div>
      </div>
    </div>
  );
}
