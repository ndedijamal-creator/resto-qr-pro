// =====================================================================
// Page publique accessible après le scan du QR Code d'une table.
// Le client consulte le menu, ajoute des produits au panier et
// peut appeler un serveur.
// =====================================================================
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { Category, CartItem, RestaurantTable } from '../../types';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import CallWaiterButton from '../../components/CallWaiterButton';

const LABELS_STATUT_TABLE: Record<RestaurantTable['statut'], string> = {
  libre: 'Libre',
  occupee: 'Occupée',
  reservee: 'Réservée',
  hors_service: 'Hors service',
};

const COULEURS_STATUT_TABLE: Record<RestaurantTable['statut'], string> = {
  libre: 'bg-green-50 text-green-700',
  occupee: 'bg-primary-50 text-primary-700',
  reservee: 'bg-amber-50 text-amber-700',
  hors_service: 'bg-black/5 text-ink/40',
};

export default function Menu() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState<(RestaurantTable & { restaurant_nom: string; restaurant_id: number }) | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [panier, setPanier] = useState<CartItem[]>([]);
  const [categorieActive, setCategorieActive] = useState<number | null>(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const { data: tableData } = await api.get(`/tables/public/${code}`);
        setTable(tableData);

        const { data: menuData } = await api.get('/menu/public', {
          params: { restaurant_id: tableData.restaurant_id },
        });
        setCategories(menuData);
        setCategorieActive(menuData[0]?.id ?? null);
      } catch {
        setErreur("Ce QR Code n'est plus valide. Merci de contacter le personnel.");
      }
    }
    charger();
  }, [code]);

  function ajouterAuPanier(produit: Category['produits'][number]) {
    setPanier((prev) => {
      const existant = prev.find((i) => i.product.id === produit.id);
      if (existant) {
        return prev.map((i) =>
          i.product.id === produit.id ? { ...i, quantite: i.quantite + 1 } : i
        );
      }
      return [...prev, { product: produit, quantite: 1 }];
    });
  }

  function modifierQuantite(productId: number, delta: number) {
    setPanier((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantite: i.quantite + delta } : i))
        .filter((i) => i.quantite > 0)
    );
  }

  const totalPanier = panier.reduce((sum, i) => sum + i.product.prix * i.quantite, 0);
  const nombreArticles = panier.reduce((sum, i) => sum + i.quantite, 0);

  if (erreur) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-6 text-center">
        <p className="text-ink/60">{erreur}</p>
      </div>
    );
  }

  if (!table) {
    return <div className="flex min-h-screen items-center justify-center text-ink/40">Chargement du menu…</div>;
  }

  return (
    <div className="min-h-screen bg-muted pb-28">
      {/* En-tête */}
      <header className="sticky top-0 z-10 bg-surface/95 px-5 pb-4 pt-6 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Table {table.numero}
            </p>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-ink">{table.restaurant_nom}</h1>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${COULEURS_STATUT_TABLE[table.statut]}`}>
                {LABELS_STATUT_TABLE[table.statut]}
              </span>
            </div>
          </div>
          <CallWaiterButton tableId={table.id} />
        </div>

        {/* Onglets catégories */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategorieActive(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
                categorieActive === cat.id
                  ? 'bg-ink text-white'
                  : 'bg-muted text-ink/60 hover:bg-black/5'
              }`}
            >
              {cat.nom}
            </button>
          ))}
        </div>
      </header>

      {/* Liste des produits */}
      <main className="space-y-3 px-5 pt-4">
        {categories
          .find((c) => c.id === categorieActive)
          ?.produits.filter((p) => p.disponible)
          .map((produit) => {
            const dansLePanier = panier.find((i) => i.product.id === produit.id);
            return (
              <div key={produit.id} className="flex gap-3 rounded-xl2 bg-surface p-3 shadow-card">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                  {produit.photo_url && (
                    <img src={produit.photo_url} alt={produit.nom} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{produit.nom}</h3>
                    {produit.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink/50">{produit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{produit.prix.toLocaleString()} XAF</span>
                    {dansLePanier ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => modifierQuantite(produit.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{dansLePanier.quantite}</span>
                        <button
                          onClick={() => modifierQuantite(produit.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => ajouterAuPanier(produit)}
                        className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white"
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </main>

      {/* Barre panier flottante */}
      {nombreArticles > 0 && (
        <button
          onClick={() =>
            navigate(`/table/${code}/panier`, { state: { panier, tableId: table.id, restaurantNom: table.restaurant_nom } })
          }
          className="fixed inset-x-5 bottom-5 flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-white shadow-xl"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart size={18} />
            {nombreArticles} article{nombreArticles > 1 ? 's' : ''}
          </span>
          <span className="text-sm font-bold">{totalPanier.toLocaleString()} XAF</span>
        </button>
      )}
    </div>
  );
}
