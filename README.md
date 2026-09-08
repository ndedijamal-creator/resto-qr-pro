# RESTO QR PRO

Plateforme SaaS de commande sans contact pour restaurants : le client scanne le QR Code de sa table, consulte le menu, commande depuis son téléphone et suit sa commande en temps réel ; le restaurant gère tables, menu, commandes et statistiques depuis des interfaces dédiées par rôle.

## 1. Arborescence du projet

```
resto-qr-pro/
├── database/
│   └── schema.sql              # Schéma MySQL complet + données de démo
├── backend/                    # API Express.js (Node.js)
│   ├── src/
│   │   ├── config/db.js        # Pool de connexions MySQL
│   │   ├── middleware/         # auth.js (JWT), roles.js (contrôle d'accès)
│   │   ├── utils/               # jwt.js, qrcode.js
│   │   ├── controllers/         # Logique métier par module
│   │   ├── routes/              # Définition des endpoints REST
│   │   ├── sockets/socket.js    # Temps réel (Socket.IO)
│   │   └── server.js            # Point d'entrée
│   ├── .env.example
│   └── package.json
└── frontend/                   # Application React (Vite + TypeScript)
    ├── src/
    │   ├── api/axios.ts         # Client HTTP + refresh token automatique
    │   ├── context/AuthContext.tsx
    │   ├── hooks/useRestaurantSocket.ts
    │   ├── routes/ProtectedRoute.tsx
    │   ├── components/StaffLayout.tsx
    │   ├── pages/
    │   │   ├── auth/Login.tsx
    │   │   ├── client/           # Menu.tsx, Cart.tsx, OrderTracking.tsx
    │   │   ├── admin/            # Dashboard.tsx, Tables.tsx, MenuManagement.tsx
    │   │   ├── kitchen/Kitchen.tsx
    │   │   └── server/ServerView.tsx
    │   └── types/index.ts
    ├── .env.example
    └── package.json
```

## 2. Rôles et parcours

| Rôle | Accès |
|---|---|
| **Client** | Aucun compte requis. Accède via `/table/:code` après avoir scanné le QR Code. |
| **Administrateur** | Accès complet : tables, menu, commandes, utilisateurs, statistiques. |
| **Gérant** | Ventes, statistiques, commandes, tables. |
| **Serveur** | Voit les commandes prêtes, sert, gère les appels clients. |
| **Cuisinier** | Voit les commandes, passe "en préparation" puis "prête". |

## 3. Base de données MySQL

```bash
mysql -u root -p < database/schema.sql
```

Le script crée la base `resto_qr_pro`, les 12 tables, les index de performance, et des données de démonstration prêtes à l'emploi : 1 restaurant, 4 comptes (un par rôle), 3 tables, 4 catégories et 10 produits.

**Comptes de démonstration (mot de passe identique pour tous) :**

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@resto.com | Password123! |
| Gérant | gerant@resto.com | Password123! |
| Serveur | serveur@resto.com | Password123! |
| Cuisinier | cuisinier@resto.com | Password123! |

Ces mots de passe sont déjà hachés correctement dans `schema.sql` — aucune manipulation supplémentaire n'est nécessaire. Pensez à les changer avant toute mise en production réelle.

## 4. Installation du backend

```bash
cd backend
npm install
cp .env.example .env   # puis renseignez vos identifiants MySQL et vos secrets JWT
npm run dev             # démarre avec nodemon sur http://localhost:5000
```

## 5. Installation du frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev             # démarre sur http://localhost:5173
```

Pour tester le scan du QR Code depuis un vrai téléphone (et pas seulement depuis ce PC), remplacez `localhost` par l'adresse IP locale de votre PC dans `backend/.env` (`PUBLIC_APP_URL`, `FRONTEND_URL`) et `frontend/.env` (`VITE_API_URL`, `VITE_SOCKET_URL`) — votre téléphone et votre PC doivent être sur le même Wi-Fi. `vite.config.ts` est déjà configuré avec `host: true` pour accepter les connexions depuis le réseau.

## 6. Scripts utilitaires (optionnels)

Le dossier `backend` contient quelques scripts en ligne de commande, utiles au quotidien sans passer par phpMyAdmin :

| Script | Utilité |
|---|---|
| `node creer-mot-de-passe.js <email> <mot_de_passe>` | Définir/changer le mot de passe d'un compte |
| `node lister-tables.js` | Afficher le lien client de chaque table |
| `node reparer-qrcodes.js` | Corriger la taille de la colonne QR Code et régénérer tous les QR Codes (déjà appliqué dans `schema.sql`, utile seulement si vous avez une ancienne base) |

## 7. Flux de commande (temps réel)

1. Le client scanne le QR Code → `GET /api/tables/public/:code` identifie la table et le restaurant.
2. Il consulte le menu → `GET /api/menu/public?restaurant_id=...`.
3. Il valide son panier → `POST /api/orders` crée la commande et diffuse l'événement `nouvelle_commande` à tout le personnel connecté (Socket.IO, room `restaurant_<id>`).
4. Le cuisinier fait progresser le statut → `PATCH /api/orders/:id/statut`, ce qui diffuse `commande_maj` au personnel **et** au client (room `table_<id>`), qui voit sa page de suivi se mettre à jour instantanément.
5. Le client peut à tout moment appeler un serveur → `POST /api/notifications/call-waiter`, notifié en direct côté personnel.

## 8. Sécurité

- Authentification JWT (access token courte durée + refresh token), hachage bcrypt des mots de passe.
- Contrôle d'accès par rôle sur chaque route sensible (middleware `roles.js`).
- `helmet` (en-têtes HTTP sécurisés) et `express-rate-limit` (anti-abus) activés par défaut.
- Les prix des commandes sont toujours recalculés côté serveur à partir de la base de données — jamais depuis les données envoyées par le client.

## 9. Prochaines étapes suggérées

Ce socle couvre l'architecture, la base de données et les 10 modules fonctionnels demandés avec un code de production. Pour aller plus loin avant une mise en ligne réelle :
- Brancher un vrai service d'envoi d'email (SMTP) pour la réinitialisation de mot de passe.
- Ajouter la gestion des utilisateurs (CRUD staff) côté interface admin.
- Intégrer un prestataire de paiement mobile money / carte bancaire réel.
- Ajouter des tests automatisés (Jest / Supertest côté backend, Vitest côté frontend).
- Mettre en place le déploiement (Docker, CI/CD, variables d'environnement de production).
