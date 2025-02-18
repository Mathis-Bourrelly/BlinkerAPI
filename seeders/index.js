const seedUsers = require('./users.seeder');
const seedFollows = require('./follows.seeder');
const seedProfiles = require('./profiles.seeder');

const runSeeders = async () => {
    try {
        console.log('Démarrage du seeding...');
        await seedUsers();
        await seedFollows();
        await seedProfiles();
        console.log('Tous les seeders ont été exécutés avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors du seeding :', error);
        process.exit(1);
    }
};

runSeeders();
