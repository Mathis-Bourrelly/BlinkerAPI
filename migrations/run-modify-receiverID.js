require('dotenv').config();
const migration = require('./20240703_modify_receiverID_in_messages');

async function runMigration() {
    try {
        console.log('Démarrage de la migration pour modifier receiverID dans Messages...');
        await migration.up();
        console.log('Migration terminée avec succès');
    } catch (error) {
        console.error('Migration échouée:', error);
    } finally {
        process.exit();
    }
}

runMigration();
