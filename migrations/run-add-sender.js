require('dotenv').config();
const addSenderToMessages = require('./20240612_add_sender_to_messages');

async function runMigration() {
    try {
        console.log('Démarrage de la migration pour ajouter le champ senderID...');
        await addSenderToMessages();
        console.log('Migration terminée avec succès !');
    } catch (error) {
        console.error('Erreur lors de la migration:', error);
    } finally {
        process.exit();
    }
}

runMigration();
