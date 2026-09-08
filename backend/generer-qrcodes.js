// =====================================================================
// Script utilitaire : génère un QR Code pour chaque table qui n'en a
// pas encore (utile pour les tables créées directement en SQL, comme
// les données de démonstration).
//
// Utilisation (depuis le dossier backend, une fois npm install fait) :
//   node generer-qrcodes.js
// =====================================================================
const { pool } = require('./src/config/db');
const { genererQRCodeTable } = require('./src/utils/qrcode');
require('dotenv').config();

async function main() {
  try {
    const [tablesSansQR] = await pool.query(
      `SELECT t.id, t.numero FROM restaurant_tables t
       LEFT JOIN qr_codes q ON q.table_id = t.id
       WHERE q.id IS NULL`
    );

    if (tablesSansQR.length === 0) {
      console.log('✅ Toutes les tables ont déjà un QR Code.');
      return;
    }

    console.log(`\n🔧 Génération de ${tablesSansQR.length} QR Code(s)...\n`);

    for (const table of tablesSansQR) {
      const { codeUnique, url, imageDataUrl } = await genererQRCodeTable(table.id);

      await pool.query(
        'INSERT INTO qr_codes (table_id, code_unique, url, image_url) VALUES (?, ?, ?, ?)',
        [table.id, codeUnique, url, imageDataUrl]
      );

      console.log(`Table ${table.numero} :`);
      console.log(`   👉 http://localhost:5173/table/${codeUnique}\n`);
    }

    console.log('✅ Terminé. Relancez "node lister-tables.js" pour revoir tous les liens.');
  } catch (error) {
    console.error('Erreur :', error.message);
  } finally {
    await pool.end();
  }
}

main();
