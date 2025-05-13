// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const seedUsers = require('./users.seeder');
const seedFollows = require('./follows.seeder');
const seedBlinks = require('./blinks.seeder');
const seedMessages = require('./messages.seeder');

const runSeeders = async () => {
    try {
        console.log('Démarrage du seeding...');
        //await seedUsers();
        //await seedFollows();
        //await seedBlinks();
        await seedMessages();
        console.log('Tous les seeders ont été exécutés avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du seeding :', error);
        process.exit(1);
    }
};

runSeeders();
