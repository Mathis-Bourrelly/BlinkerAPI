const BlinkService = require('../services/blinks.service');
const MessagesService = require('../services/messages.service');
const { AUTO_DELETE_INTERVAL } = require('../../config/blinks.config');

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

setInterval(deleteExpiredData, AUTO_DELETE_INTERVAL);

module.exports = deleteExpiredData;