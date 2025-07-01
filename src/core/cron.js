const BlinkService = require('../services/blinks.service');
const MessagesService = require('../services/messages.service');
const UsersService = require('../services/users.service');
const { AUTO_DELETE_INTERVAL } = require('../../config/blinks.config');
const seedBlinks = require("../../seeders/blinks.seeder");

console.log(`🚀 Suppression automatique activée. Intervalle: ${AUTO_DELETE_INTERVAL / 1000} secondes.`);

async function deleteExpiredData() {
    try {
        console.log("🔄 Suppression des Blinks expirés...");
        await BlinkService.deleteExpiredBlinks();
        console.log("✅ Blinks expirés supprimés.");

        console.log("🔄 Suppression des Messages expirés...");
        await MessagesService.deleteExpiredMessages();
        console.log("✅ Messages expirés supprimés.");
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des données expirées :", error);
    }
}

/**
 * Met à jour les scores de tous les utilisateurs
 */
async function updateAllUserScores() {
    try {
        console.log("🔄 Mise à jour des scores utilisateurs...");
        const updatedCount = await UsersService.updateAllUserScores();
        console.log(`✅ Scores mis à jour pour ${updatedCount} utilisateurs`);
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour des scores:", error);
    }
}



// Suppression des données expirées toutes les X secondes (défini dans la config)
setInterval(deleteExpiredData, AUTO_DELETE_INTERVAL);

// Seeding de blinks toutes les 12h
setInterval(seedBlinks, 12 * 3600000);

// Mise à jour des scores utilisateurs toutes les 12 heures
setInterval(updateAllUserScores, 12 * 3600000);

// Exécuter la mise à jour des scores au démarrage
setTimeout(updateAllUserScores, 60000); // Attendre 1 minute après le démarrage

module.exports = {
    deleteExpiredData,
    updateAllUserScores
};