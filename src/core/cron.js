const BlinkService = require('../services/blinks.service');
const { AUTO_DELETE_INTERVAL } = require('../../config/blinks.config'); // On importe depuis config/

console.log(`🚀 Suppression automatique des Blinks activée. Intervalle: ${AUTO_DELETE_INTERVAL / 1000} secondes.`);

setInterval(async () => {
    try {
        console.log("🔄 Exécution de la suppression automatique des Blinks expirés...");
        await BlinkService.deleteExpiredBlinks();
        console.log("✅ Blinks expirés supprimés.");
    } catch (error) {
        console.error("❌ Erreur lors de la suppression des Blinks expirés :", error);
    }
}, AUTO_DELETE_INTERVAL);