// =====================================================================
// Script de réparation : la colonne qr_codes.image_url était trop petite
// (VARCHAR(255)) pour contenir une image de QR Code encodée en base64,
// ce qui la tronquait et cassait l'affichage. Ce script :
//   1. Agrandit la colonne pour qu'elle puisse contenir l'image complète.
//   2. Régénère tous les QR Codes existants (les anciens étaient corrompus).
//
// Utilisation (depuis le dossier backend, une fois npm install fait) :
//   node reparer-qrcodes.js
// =====================================================================
const { pool } = require('./src/config/db');
const { genererQRCodeTable } = require('./src/utils/qrcode');
require('dotenv').config();

async function main() {
  try {
    console.log('🔧 Agrandissement de la colonne image_url...');
    await pool.query('ALTER TABLE qr_codes MODIFY image_url MEDIUMTEXT NULL');
    console.log('✅ Colonne corrigée.\n');

    const [tables] = await pool.query('SELECT id, numero FROM restaurant_tables');

    console.log(`🔧 Régénération de ${tables.length} QR Code(s)...\n`);

    for (const table of tables) {
      const { codeUnique, url, imageDataUrl } = await genererQRCodeTable(table.id);

      await pool.query(
        `INSERT INTO qr_codes (table_id, code_unique, url, image_url)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE code_unique = VALUES(code_unique), url = VALUES(url), image_url = VALUES(image_url)`,
        [table.id, codeUnique, url, imageDataUrl]
      );

      console.log(`Table ${table.numero} :`);
      console.log(`   👉 ${url}\n`);
    }

    console.log('✅ Terminé ! Rechargez la page Tables dans votre navigateur pour voir les QR Codes corrigés.');
  } catch (error) {
    console.error('❌ Erreur :', error.message);
  } finally {
    await pool.end();
  }
}

main();
