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

    async calculateRemainingTime(blinkID) {
        const blink = await BlinkRepository.getBlinkHeaderById(blinkID);
        if (!blink) throw new Error('Blink non trouvé');

        const elapsedTime = (new Date() - blink.createdAt) / 1000; // Temps écoulé en secondes
        const initialLifetime = 86400; // 24h en secondes
        const likeBonus = blink.likeCount * 86.4;
        const commentBonus = blink.commentCount * 172.8;
        const dislikePenalty = blink.dislikeCount * 43.2;

        return Math.max(0, Math.min(initialLifetime + likeBonus + commentBonus - dislikePenalty - elapsedTime, initialLifetime));
    }

    async deleteExpiredBlinks() {
        const transaction = await sequelize.transaction();
        try {
            const blinks = await BlinkRepository.getAllBlinks(transaction);

            for (const blink of blinks) {
                const remainingTime = await this.calculateRemainingTime(blink.blinkID);
                if (remainingTime === 0) {
                    await BlinkRepository.deleteBlink(blink.blinkID, transaction);
                }
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new BlinkService();