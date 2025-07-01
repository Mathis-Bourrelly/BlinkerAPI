require('dotenv').config();
const seedMessages = require('./messages.seeder');

async function runMessageSeeder() {
    try {
        console.log('Démarrage du seeding des messages...');
        await seedMessages();
        console.log('Seeding des messages terminé avec succès !');
    } catch (error) {
        console.error('Erreur lors du seeding des messages:', error);
    } finally {
        process.exit();
    }
}

runMessageSeeder();
