// =====================================================================
// Bouton "Appeler un serveur" — réutilisé sur toutes les pages du
// parcours client (menu, panier, suivi de commande) pour que le client
// puisse appeler à n'importe quel moment, pas seulement en consultant
// le menu.
// =====================================================================
import { useState } from 'react';
import api from '../api/axios';
import { Bell } from 'lucide-react';

export default function CallWaiterButton({ tableId }: { tableId: number }) {
  const [appelEnvoye, setAppelEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function appelerServeur() {
    if (envoi || appelEnvoye) return;
    setEnvoi(true);
    try {
      await api.post('/notifications/call-waiter', { table_id: tableId });
      setAppelEnvoye(true);
      setTimeout(() => setAppelEnvoye(false), 15000);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <button
      onClick={appelerServeur}
      disabled={envoi || appelEnvoye}
      className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-50 px-3.5 py-2 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:opacity-70"
    >
      <Bell size={16} />
      {appelEnvoye ? 'Serveur prévenu !' : 'Appeler'}
    </button>
  );
}
