// =====================================================================
// Page panier — le client ajuste ses quantités puis valide sa commande
// =====================================================================
import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import type { CartItem } from '../../types';
import { ChevronLeft, Minus, Plus, Trash2, Banknote, CreditCard, Smartphone } from 'lucide-react';
import CallWaiterButton from '../../components/CallWaiterButton';

const MODES_PAIEMENT = [
  { valeur: 'especes', label: 'Espèces', icon: Banknote },
  { valeur: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { valeur: 'carte', label: 'Carte bancaire', icon: CreditCard },
] as const;

export default function Cart() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { panier: CartItem[]; tableId: number; restaurantNom: string } | null;

  const [panier, setPanier] = useState<CartItem[]>(state?.panier || []);
  const [note, setNote] = useState('');
  const [modePaiement, setModePaiement] = useState<(typeof MODES_PAIEMENT)[number]['valeur']>('especes');
  const [envoi, setEnvoi] = useState(false);

  if (!state) {
    navigate(`/table/${code}`);
    return null;
  }

  function modifierQuantite(productId: number, delta: number) {
    setPanier((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantite: i.quantite + delta } : i))
        .filter((i) => i.quantite > 0)
    );
  }

  const total = panier.reduce((sum, i) => sum + i.product.prix * i.quantite, 0);

  async function validerCommande() {
    setEnvoi(true);
    try {
      const { data } = await api.post('/orders', {
        table_id: state!.tableId,
        note_client: note || undefined,
        methode_paiement: modePaiement,
        items: panier.map((i) => ({
          product_id: i.product.id,
          quantite: i.quantite,
          remarque: i.remarque,
        })),
      });
      navigate(`/table/${code}/suivi/${data.order.id}`);
    } catch {
      setEnvoi(false);
      alert("Impossible d'envoyer la commande, veuillez réessayer.");
    }
  }

  return (
    <div className="min-h-screen bg-muted pb-32">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-ink/60">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-ink">Votre panier</h1>
        </div>
        <CallWaiterButton tableId={state.tableId} />
      </header>

      <main className="space-y-3 px-5 pt-4">
        {panier.length === 0 && (
          <p className="pt-10 text-center text-sm text-ink/40">Votre panier est vide.</p>
        )}

        {panier.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 rounded-xl2 bg-surface p-3 shadow-card">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-ink">{item.product.nom}</h3>
              <p className="text-xs text-primary">{item.product.prix.toLocaleString()} XAF</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => modifierQuantite(item.product.id, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted"
              >
                {item.quantite === 1 ? <Trash2 size={13} /> : <Minus size={14} />}
              </button>
              <span className="w-4 text-center text-sm font-medium">{item.quantite}</span>
              <button
                onClick={() => modifierQuantite(item.product.id, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ))}

        {panier.length > 0 && (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Mode de paiement</p>
              <div className="grid grid-cols-3 gap-2">
                {MODES_PAIEMENT.map(({ valeur, label, icon: Icon }) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setModePaiement(valeur)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl2 border p-3 text-xs font-medium transition ${
                      modePaiement === valeur
                        ? 'border-primary bg-primary-50 text-primary-700'
                        : 'border-black/10 bg-surface text-ink/60 hover:bg-black/5'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Une remarque pour votre commande ? (allergie, cuisson, etc.)"
              className="w-full rounded-xl2 border border-black/10 bg-surface p-3 text-sm outline-none focus:border-primary"
              rows={3}
            />
          </>
        )}
      </main>

      {panier.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 space-y-3 rounded-t-2xl bg-surface p-5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink/60">Total</span>
            <span className="text-lg font-bold text-ink">{total.toLocaleString()} XAF</span>
          </div>
          <button
            onClick={validerCommande}
            disabled={envoi}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
          >
            {envoi ? 'Envoi en cours…' : 'Valider ma commande'}
          </button>
        </div>
      )}
    </div>
  );
}
