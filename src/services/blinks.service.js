const BlinkRepository = require('../repository/blinks.repository.js');
const { sequelize } = require('../core/postgres');

class BlinkService {
    /**
     * Crée un Blink avec son contenu
     */
    async createBlinkWithContent({ userID, contents }) {
        const transaction = await sequelize.transaction();
        try {
            const blink = await BlinkRepository.createBlink(userID, transaction);
            await BlinkRepository.addBlinkContents(blink.blinkID, contents, transaction);
            await transaction.commit();
            return blink;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Récupère un Blink par son ID
     */
    async getBlinkById(blinkID) {
        return await BlinkRepository.getBlinkById(blinkID);
    }

    /**
     * Met à jour un Blink et son contenu
     */
    async updateBlink(blinkID, { contents }) {
        const transaction = await sequelize.transaction();
        try {
            const blink = await BlinkRepository.getBlinkById(blinkID);
            if (!blink) throw new Error('Blink non trouvé');

            await BlinkRepository.deleteBlinkContents(blinkID, transaction);
            await BlinkRepository.addBlinkContents(blinkID, contents, transaction);

            await transaction.commit();
            return blink;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Supprime un Blink et son contenu
     */
    async deleteBlink(blinkID) {
        return await BlinkRepository.deleteBlink(blinkID);
    }
}

module.exports = new BlinkService();