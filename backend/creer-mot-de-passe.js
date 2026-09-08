// =====================================================================
// Script utilitaire : définir le mot de passe d'un utilisateur
// directement en ligne de commande, sans passer par phpMyAdmin.
//
// Utilisation (depuis le dossier backend, une fois npm install fait) :
//   node creer-mot-de-passe.js admin@resto.com MonMotDePasse123!
// =====================================================================
const bcrypt = require('bcrypt');
const { pool } = require('./src/config/db');
require('dotenv').config();

async function main() {
  const [email, motDePasse] = process.argv.slice(2);

  if (!email || !motDePasse) {
    console.log('Usage : node creer-mot-de-passe.js <email> <mot_de_passe>');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(motDePasse, 10);

    const [result] = await pool.query(
      'UPDATE users SET mot_de_passe = ? WHERE email = ?',
      [hash, email]
    );

    if (result.affectedRows === 0) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email : ${email}`);
    } else {
      console.log(`✅ Mot de passe mis à jour pour ${email}.`);
      console.log(`   Vous pouvez maintenant vous connecter avec :`);
      console.log(`   Email : ${email}`);
      console.log(`   Mot de passe : ${motDePasse}`);
    }
  } catch (error) {
    console.error('Erreur :', error.message);
  } finally {
    await pool.end();
  }
}

main();
