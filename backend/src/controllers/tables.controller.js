// =====================================================================
// Contrôleur de gestion des tables et de leurs QR Codes
// =====================================================================
const { pool } = require('../config/db');
const { genererQRCodeTable } = require('../utils/qrcode');

// GET /api/tables — liste des tables du restaurant connecté
async function getTables(req, res) {
  try {
    const [tables] = await pool.query(
      `SELECT t.*, q.code_unique, q.url, q.image_url
       FROM restaurant_tables t
       LEFT JOIN qr_codes q ON q.table_id = t.id
       WHERE t.restaurant_id = ?
       ORDER BY t.numero ASC`,
      [req.user.restaurant_id]
    );
    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tables.' });
  }
}

// GET /api/tables/public/:code — accès public via scan du QR Code
async function getTableByCode(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT t.id, t.numero, t.statut, t.restaurant_id, r.nom AS restaurant_nom, r.couleur_primaire
       FROM qr_codes q
       JOIN restaurant_tables t ON t.id = q.table_id
       JOIN restaurants r ON r.id = t.restaurant_id
       WHERE q.code_unique = ?`,
      [req.params.code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Table introuvable pour ce QR Code.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
}

// POST /api/tables — créer une table + générer automatiquement son QR Code
async function createTable(req, res) {
  const { numero, capacite } = req.body;

  if (!numero) {
    return res.status(400).json({ message: 'Le numéro de table est obligatoire.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO restaurant_tables (restaurant_id, numero, capacite) VALUES (?, ?, ?)',
      [req.user.restaurant_id, numero, capacite || 4]
    );

    const tableId = result.insertId;
    const { codeUnique, url, imageDataUrl } = await genererQRCodeTable(tableId);

    await connection.query(
      'INSERT INTO qr_codes (table_id, code_unique, url, image_url) VALUES (?, ?, ?, ?)',
      [tableId, codeUnique, url, imageDataUrl]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Table créée avec succès.',
      table: { id: tableId, numero, capacite: capacite || 4, statut: 'libre' },
      qrCode: { codeUnique, url, imageDataUrl },
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de la table.' });
  } finally {
    connection.release();
  }
}

// PUT /api/tables/:id
async function updateTable(req, res) {
  const { numero, capacite, statut } = req.body;
  try {
    await pool.query(
      `UPDATE restaurant_tables SET numero = COALESCE(?, numero), capacite = COALESCE(?, capacite),
       statut = COALESCE(?, statut) WHERE id = ? AND restaurant_id = ?`,
      [numero, capacite, statut, req.params.id, req.user.restaurant_id]
    );
    res.json({ message: 'Table mise à jour.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
}

// DELETE /api/tables/:id
async function deleteTable(req, res) {
  try {
    await pool.query(
      'DELETE FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.user.restaurant_id]
    );
    res.json({ message: 'Table supprimée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

// POST /api/tables/:id/generate-qr — (ré)génère le QR Code d'une table existante.
// Utile si une table a été créée sans QR Code (import direct en base, migration, etc.)
async function generateQrCode(req, res) {
  try {
    const [[table]] = await pool.query(
      'SELECT * FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.user.restaurant_id]
    );
    if (!table) return res.status(404).json({ message: 'Table introuvable.' });

    const { codeUnique, url, imageDataUrl } = await genererQRCodeTable(table.id);

    // Si un QR Code existe déjà pour cette table, on le remplace (regénération)
    await pool.query(
      `INSERT INTO qr_codes (table_id, code_unique, url, image_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code_unique = VALUES(code_unique), url = VALUES(url), image_url = VALUES(image_url)`,
      [table.id, codeUnique, url, imageDataUrl]
    );

    res.json({ message: 'QR Code généré.', qrCode: { codeUnique, url, imageDataUrl } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du QR Code.' });
  }
}

// Génère automatiquement un QR Code pour toutes les tables qui n'en ont pas encore.
// Appelé au démarrage du serveur pour "auto-réparer" les tables créées sans QR Code
// (ex : données de démonstration insérées directement en SQL).
async function genererQrCodesManquants() {
  const [tablesSansQR] = await pool.query(
    `SELECT t.id, t.numero FROM restaurant_tables t
     LEFT JOIN qr_codes q ON q.table_id = t.id
     WHERE q.id IS NULL`
  );

  for (const table of tablesSansQR) {
    const { codeUnique, url, imageDataUrl } = await genererQRCodeTable(table.id);
    await pool.query(
      'INSERT INTO qr_codes (table_id, code_unique, url, image_url) VALUES (?, ?, ?, ?)',
      [table.id, codeUnique, url, imageDataUrl]
    );
    console.log(`   ↳ QR Code généré automatiquement pour la table ${table.numero}`);
  }

  if (tablesSansQR.length > 0) {
    console.log(`✅ ${tablesSansQR.length} QR Code(s) généré(s) automatiquement au démarrage.`);
  }
}

module.exports = {
  getTables,
  getTableByCode,
  createTable,
  updateTable,
  deleteTable,
  generateQrCode,
  genererQrCodesManquants,
};
