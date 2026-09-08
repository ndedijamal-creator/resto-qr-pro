// =====================================================================
// Script utilitaire : afficher la liste des tables et leur lien de
// QR Code, directement en ligne de commande (sans passer par phpMyAdmin).
//
// Utilisation (depuis le dossier backend, une fois npm install fait) :
//   node lister-tables.js
// =====================================================================
const { pool } = require('./src/config/db');
require('dotenv').config();

async function main() {
  try {
    const [tables] = await pool.query(
      `SELECT t.numero, t.capacite, t.statut, q.code_unique
       FROM restaurant_tables t
       LEFT JOIN qr_codes q ON q.table_id = t.id
       ORDER BY t.numero ASC`
    );

    if (tables.length === 0) {
      console.log('Aucune table trouvée. Avez-vous bien importé schema.sql ?');
      return;
    }

    console.log('\n📋 Liste des tables et de leurs liens client :\n');

    tables.forEach((table) => {
      console.log(`Table ${table.numero} (${table.capacite} pers., ${table.statut})`);
      if (table.code_unique) {
        console.log(`   👉 http://localhost:5173/table/${table.code_unique}`);
      } else {
        console.log('   ⚠️  Pas de QR Code généré pour cette table.');
      }
      console.log('');
    });
  } catch (error) {
    console.error('Erreur :', error.message);
  } finally {
    await pool.end();
  }
}

main();
