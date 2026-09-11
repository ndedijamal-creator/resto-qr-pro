// =====================================================================
// RESTO QR PRO — Point d'entrée du serveur Express
// =====================================================================
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const { initSocket } = require('./sockets/socket');
const { genererQrCodesManquants } = require('./controllers/tables.controller');

// Routes
const authRoutes = require('./routes/auth.routes');
const tablesRoutes = require('./routes/tables.routes');
const menuRoutes = require('./routes/menu.routes');
const ordersRoutes = require('./routes/orders.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------
// Middlewares globaux
// ---------------------------------------------------------------------
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Limite le nombre de requêtes pour prévenir les abus (brute-force, DDoS léger)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { message: 'Trop de requêtes, veuillez réessayer plus tard.' },
});
app.use('/api/', limiter);

// ---------------------------------------------------------------------
// Routes de l'API
// ---------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RESTO QR PRO API opérationnelle.' });
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// Gestion centralisée des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur.' });
});

// ---------------------------------------------------------------------
// Démarrage du serveur (HTTP + Socket.IO)
//
// Important : le serveur commence à écouter IMMÉDIATEMENT, sans attendre
// la connexion à la base de données. Certains hébergeurs (Back4app, Render...)
// vérifient que le port répond en 1 seconde à peine — si on attendait la
// base de données avant d'ouvrir le port, le moindre aléa réseau ferait
// échouer le déploiement, même si tout finit par fonctionner normalement.
// La connexion à MySQL et la génération des QR Codes manquants se font
// donc en tâche de fond, une fois le serveur déjà démarré.
// ---------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 RESTO QR PRO backend démarré sur le port ${PORT}`);
});

async function initialiserApresDemarrage() {
  try {
    await testConnection();
  } catch (error) {
    console.error('⚠️  Connexion MySQL indisponible pour le moment :', error.message);
    return; // Pas la peine de tenter la génération des QR Codes sans base de données
  }

  // Auto-répare les tables qui n'ont pas encore de QR Code (ex : données
  // de démonstration insérées directement en SQL) — plus besoin de script manuel.
  try {
    await genererQrCodesManquants();
  } catch (error) {
    console.error('⚠️  Impossible de vérifier/générer les QR Codes manquants :', error.message);
  }
}

initialiserApresDemarrage();

module.exports = { app, server };
