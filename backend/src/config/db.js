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

// Vérifie la connexion au démarrage du serveur
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie avec succès.');
    connection.release();
  } catch (error) {
    console.error('❌ Impossible de se connecter à MySQL :', error.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
