// =====================================================================
// Gestion des tables — création, modification, suppression, QR Codes
// =====================================================================
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StaffLayout from '../../components/StaffLayout';
import type { RestaurantTable } from '../../types';
import { Plus, Trash2, QrCode, Download } from 'lucide-react';

const COULEURS_STATUT: Record<RestaurantTable['statut'], string> = {
  libre: 'bg-green-50 text-green-700',
  occupee: 'bg-primary-50 text-primary-700',
  reservee: 'bg-amber-50 text-amber-700',
  hors_service: 'bg-black/5 text-ink/40',
};

const LABELS_STATUT: Record<RestaurantTable['statut'], string> = {
  libre: 'Libre',
  occupee: 'Occupée',
  reservee: 'Réservée',
  hors_service: 'Hors service',
};

export default function Tables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [nouveauNumero, setNouveauNumero] = useState('');
  const [nouvelleCapacite, setNouvelleCapacite] = useState(4);
  const [qrAffiche, setQrAffiche] = useState<RestaurantTable | null>(null);

  async function charger() {
    const { data } = await api.get('/tables');
    setTables(data);
  }

  useEffect(() => {
    charger();
  }, []);

  async function creerTable(e: React.FormEvent) {
    e.preventDefault();
    if (!nouveauNumero) return;
    await api.post('/tables', { numero: nouveauNumero, capacite: nouvelleCapacite });
    setNouveauNumero('');
    setNouvelleCapacite(4);
    charger();
  }

  async function changerStatut(id: number, statut: RestaurantTable['statut']) {
    await api.put(`/tables/${id}`, { statut });
    charger();
  }

  async function supprimerTable(id: number) {
    if (!confirm('Supprimer définitivement cette table ?')) return;
    await api.delete(`/tables/${id}`);
    charger();
  }

  async function genererOuRegenererQrCode(id: number, estUneRegeneration: boolean) {
    if (estUneRegeneration) {
      const confirme = confirm(
        "Régénérer va créer un nouveau QR Code pour cette table. L'ancien (déjà imprimé ou scanné) ne fonctionnera plus. Continuer ?"
      );
      if (!confirme) return;
    }
    const { data } = await api.post(`/tables/${id}/generate-qr`);
    await charger();
    // Met à jour immédiatement la fenêtre ouverte avec la nouvelle image
    setQrAffiche((prev) => (prev ? { ...prev, image_url: data.qrCode.imageDataUrl } : prev));
  }

  return (
    <StaffLayout titre="Gestion des tables">
      <form onSubmit={creerTable} className="mb-6 flex items-end gap-3 rounded-xl2 bg-surface p-5 shadow-card">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Numéro de table</label>
          <input
            value={nouveauNumero}
            onChange={(e) => setNouveauNumero(e.target.value)}
            className="w-32 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Ex : 12"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Capacité</label>
          <input
            type="number"
            min={1}
            value={nouvelleCapacite}
            onChange={(e) => setNouvelleCapacite(Number(e.target.value))}
            className="w-24 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          <Plus size={16} /> Ajouter la table
        </button>
      </form>

      <div className="grid grid-cols-4 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="rounded-xl2 bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-lg font-bold text-ink">Table {table.numero}</span>
              <button onClick={() => supprimerTable(table.id)} className="text-ink/30 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mb-3 text-xs text-ink/50">{table.capacite} personnes</p>

            <select
              value={table.statut}
              onChange={(e) => changerStatut(table.id, e.target.value as RestaurantTable['statut'])}
              className={`mb-3 w-full rounded-lg border-none px-2 py-1.5 text-xs font-medium ${COULEURS_STATUT[table.statut]}`}
            >
              {Object.entries(LABELS_STATUT).map(([valeur, label]) => (
                <option key={valeur} value={valeur}>
                  {label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setQrAffiche(table)}
              className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium ${
                table.image_url
                  ? 'bg-muted text-ink/70 hover:bg-black/5'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <QrCode size={14} />
              {table.image_url ? 'Voir le QR Code' : 'QR Code à générer'}
            </button>
          </div>
        ))}
      </div>

      {qrAffiche && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4" onClick={() => setQrAffiche(null)}>
          <div className="w-full max-w-xs rounded-xl2 bg-surface p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 font-bold text-ink">Table {qrAffiche.numero}</h3>
            {qrAffiche.image_url ? (
              <>
                <img src={qrAffiche.image_url} alt="QR Code" className="mx-auto mb-4 h-48 w-48" />
                <div className="flex gap-2">
                  <a
                    href={qrAffiche.image_url}
                    download={`qr-table-${qrAffiche.numero}.png`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink py-2 text-xs font-medium text-white"
                  >
                    <Download size={14} /> Télécharger
                  </a>
                  <button
                    onClick={() => genererOuRegenererQrCode(qrAffiche.id, true)}
                    className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-ink/60 hover:bg-black/5"
                    title="Régénérer un nouveau QR Code pour cette table"
                  >
                    Régénérer
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-ink/40">
                  Aucun QR Code pour cette table pour le moment.
                </p>
                <button
                  onClick={() => genererOuRegenererQrCode(qrAffiche.id, false)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white hover:bg-primary-600"
                >
                  <QrCode size={14} /> Générer le QR Code
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
