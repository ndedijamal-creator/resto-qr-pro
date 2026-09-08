// =====================================================================
// Génération des QR Codes pour les tables du restaurant
// =====================================================================
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

/**
 * Génère un code unique + une image QR Code (en base64) pointant vers
 * l'URL publique de la table : {PUBLIC_APP_URL}/table/{code_unique}
 */
async function genererQRCodeTable(tableId) {
  const codeUnique = uuidv4();
  const url = `${process.env.PUBLIC_APP_URL}/table/${codeUnique}`;

  // Génère l'image en Data URL (PNG encodé en base64), prête à être
  // stockée ou affichée directement côté frontend / imprimée.
  const imageDataUrl = await QRCode.toDataURL(url, {
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    width: 400,
    margin: 2,
  });

  return { codeUnique, url, imageDataUrl };
}

module.exports = { genererQRCodeTable };
