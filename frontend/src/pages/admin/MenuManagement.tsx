// =====================================================================
// Gestion du menu — catégories et produits (CRUD complet)
// =====================================================================
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import StaffLayout from '../../components/StaffLayout';
import type { Category } from '../../types';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState<number | null>(null);

  const [formProduit, setFormProduit] = useState({ nom: '', prix: '', description: '' });
  const [produitEnEdition, setProduitEnEdition] = useState<number | null>(null);

  async function charger() {
    const { data } = await api.get('/menu');
    setCategories(data);
    if (!categorieSelectionnee && data.length) setCategorieSelectionnee(data[0].id);
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ajouterCategorie(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelleCategorie) return;
    await api.post('/menu/categories', { nom: nouvelleCategorie });
    setNouvelleCategorie('');
    charger();
  }

  async function supprimerCategorie(id: number) {
    if (!confirm('Supprimer cette catégorie et tous ses produits ?')) return;
    await api.delete(`/menu/categories/${id}`);
    charger();
  }

  async function ajouterProduit(e: React.FormEvent) {
    e.preventDefault();
    if (!formProduit.nom || !formProduit.prix || !categorieSelectionnee) return;
    await api.post('/menu/produits', {
      category_id: categorieSelectionnee,
      nom: formProduit.nom,
      prix: Number(formProduit.prix),
      description: formProduit.description,
    });
    setFormProduit({ nom: '', prix: '', description: '' });
    charger();
  }

  async function toggleDisponibilite(id: number, disponible: boolean) {
    await api.put(`/menu/produits/${id}`, { disponible: !disponible });
    charger();
  }

  async function supprimerProduit(id: number) {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.delete(`/menu/produits/${id}`);
    charger();
  }

  const categorieActive = categories.find((c) => c.id === categorieSelectionnee);

  return (
    <StaffLayout titre="Gestion du menu">
      <div className="grid grid-cols-4 gap-6">
        {/* Colonne catégories */}
        <div className="rounded-xl2 bg-surface p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold text-ink/70">Catégories</h2>
          <div className="mb-4 space-y-1">
            {categories.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between">
                <button
                  onClick={() => setCategorieSelectionnee(cat.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    categorieSelectionnee === cat.id ? 'bg-primary-50 text-primary-700' : 'text-ink/60 hover:bg-black/5'
                  }`}
                >
                  {cat.nom}
                </button>
                <button
                  onClick={() => supprimerCategorie(cat.id)}
                  className="hidden pr-2 text-ink/30 hover:text-red-500 group-hover:block"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={ajouterCategorie} className="flex gap-2">
            <input
              value={nouvelleCategorie}
              onChange={(e) => setNouvelleCategorie(e.target.value)}
              placeholder="Nouvelle catégorie"
              className="w-full rounded-lg border border-black/10 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-lg bg-ink px-2.5 text-white">
              <Plus size={14} />
            </button>
          </form>
        </div>

        {/* Colonne produits */}
        <div className="col-span-3 space-y-4">
          <form onSubmit={ajouterProduit} className="flex items-end gap-3 rounded-xl2 bg-surface p-4 shadow-card">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-ink/60">Nom du produit</label>
              <input
                value={formProduit.nom}
                onChange={(e) => setFormProduit({ ...formProduit, nom: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Ex : Poulet DG"
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-ink/60">Prix (XAF)</label>
              <input
                type="number"
                value={formProduit.prix}
                onChange={(e) => setFormProduit({ ...formProduit, prix: e.target.value })}
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <Plus size={16} /> Ajouter
            </button>
          </form>

          <div className="rounded-xl2 bg-surface shadow-card">
            {categorieActive?.produits.length === 0 && (
              <p className="p-6 text-center text-sm text-ink/40">Aucun produit dans cette catégorie.</p>
            )}
            {categorieActive?.produits.map((produit) => (
              <div
                key={produit.id}
                className="flex items-center justify-between border-b border-black/5 px-5 py-3 last:border-none"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{produit.nom}</p>
                  <p className="text-xs text-ink/40">{produit.prix.toLocaleString()} XAF</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDisponibilite(produit.id, produit.disponible)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      produit.disponible ? 'bg-green-50 text-green-700' : 'bg-black/5 text-ink/40'
                    }`}
                  >
                    {produit.disponible ? <Check size={12} /> : <X size={12} />}
                    {produit.disponible ? 'Disponible' : 'Indisponible'}
                  </button>
                  <button onClick={() => supprimerProduit(produit.id)} className="text-ink/30 hover:text-red-500">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
