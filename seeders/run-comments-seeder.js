require('dotenv').config();
const seedComments = require('./comments.seeder');

async function runCommentsSeeder() {
    try {
        console.log('Démarrage du seeding des commentaires...');
        await seedComments();
        console.log('Seeding des commentaires terminé avec succès !');
    } catch (error) {
        console.error('Erreur lors du seeding des commentaires:', error);
    } finally {
        process.exit();
    }
}

runCommentsSeeder();
