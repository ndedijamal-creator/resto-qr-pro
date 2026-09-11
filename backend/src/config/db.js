// =====================================================================
// Configuration de la connexion à MySQL via un pool de connexions
// =====================================================================
const mysql = require('mysql2/promise');
require('dotenv').config();

// Le pool gère automatiquement plusieurs connexions simultanées,
// ce qui est indispensable pour une application en production.
// DB_SSL=true active une connexion chiffrée, nécessaire pour la plupart
// des hébergeurs MySQL gérés (Aiven, PlanetScale, etc.) mais pas pour WAMP en local.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Vérifie la connexion au démarrage du serveur. Ne fait volontairement PAS
// planter le processus en cas d'échec : le serveur HTTP doit rester debout
// (pour répondre aux vérifications de santé de l'hébergeur) même si la base
// de données est temporairement injoignable ; l'erreur est simplement relayée
// à l'appelant pour être journalisée.
async function testConnection() {
  const connection = await pool.getConnection();
  console.log('✅ Connexion MySQL établie avec succès.');
  connection.release();
}

module.exports = { pool, testConnection };
