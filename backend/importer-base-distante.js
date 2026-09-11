// =====================================================================
// Script utilitaire : importe le fichier database/schema.sql directement
// sur une base de données MySQL distante (Aiven, PlanetScale, etc.),
// sans avoir besoin d'installer ou localiser un client MySQL en ligne
// de commande.
//
// Utilisation (depuis le dossier backend, une fois npm install fait) :
//   node importer-base-distante.js <host> <port> <user> <password> [database]
//
// Exemple avec Aiven :
//   node importer-base-distante.js resto-qr-pro-xxxx.l.aivencloud.com 12214 avnadmin MON_MOT_DE_PASSE
// =====================================================================
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const [host, port, user, password, database] = process.argv.slice(2);

  if (!host || !port || !user || !password) {
    console.log('Usage : node importer-base-distante.js <host> <port> <user> <password> [database]');
    process.exit(1);
  }

  const cheminSchema = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(cheminSchema, 'utf8');

  console.log(`🔧 Connexion à ${host}:${port}...`);

  const connection = await mysql.createConnection({
    host,
    port: Number(port),
    user,
    password,
    database: database || undefined,
    ssl: { rejectUnauthorized: false }, // nécessaire pour la plupart des hébergeurs MySQL gérés
    multipleStatements: true, // indispensable pour exécuter tout schema.sql d'un coup
  });

  try {
    console.log('🔧 Import de schema.sql en cours (peut prendre quelques secondes)...');
    await connection.query(sql);
    console.log('✅ Base de données importée avec succès sur le serveur distant !');
  } catch (error) {
    console.error('❌ Erreur pendant l\'import :', error.message);
  } finally {
    await connection.end();
  }
}

main();
