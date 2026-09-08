// =====================================================================
// Types TypeScript partagés dans toute l'application
// =====================================================================

export type Role = 'admin' | 'gerant' | 'serveur' | 'cuisinier';

export interface User {
  id: number;
  nom_complet: string;
  email: string;
  role: Role;
  restaurant_id: number;
}

export interface RestaurantTable {
  id: number;
  numero: string;
  capacite: number;
  statut: 'libre' | 'occupee' | 'reservee' | 'hors_service';
  code_unique?: string;
  url?: string;
  image_url?: string;
}

export interface Product {
  id: number;
  category_id: number;
  nom: string;
  description: string | null;
  prix: number;
  photo_url: string | null;
  disponible: boolean;
}

export interface Category {
  id: number;
  nom: string;
  ordre_affichage: number;
  produits: Product[];
}

export interface CartItem {
  product: Product;
  quantite: number;
  remarque?: string;
}

export type OrderStatus =
  | 'en_attente'
  | 'confirmee'
  | 'en_preparation'
  | 'prete'
  | 'servie'
  | 'annulee';

export interface OrderItem {
  id: number;
  product_id: number;
  produit_nom: string;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
  remarque: string | null;
}

export interface Order {
  id: number;
  table_id: number;
  table_numero?: string;
  statut: OrderStatus;
  total: number;
  note_client: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface Notification {
  id: number;
  restaurant_id: number;
  table_id: number | null;
  table_numero?: string;
  type: 'appel_serveur' | 'nouvelle_commande' | 'commande_prete' | 'autre';
  message: string;
  lue: boolean;
  created_at: string;
}

export interface DashboardStats {
  chiffre_affaires_jour: number;
  chiffre_affaires_mois: number;
  nombre_commandes_jour: number;
  nombre_clients_jour: number;
  produits_populaires: { nom: string; quantite_vendue: number }[];
  ventes_7_derniers_jours: { jour: string; total: number }[];
}
