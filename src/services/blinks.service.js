const BlinkRepository = require('../repository/blinks.repository.js');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');

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
            throw { code: error.code || ErrorCodes.Base.UnknownError };
        }
    }

    /**
     * Récupère un Blink par son ID
     */
    async getBlinkById(blinkID) {
        return await BlinkRepository.getBlinkById(blinkID);
    }

    /**
     * Récupère les Blinks paginés
     */
    async getPaginatedBlinks(page = 1, limit = 10, userId = null) {
        try {
            const { total, blinks } = await BlinkRepository.getPaginatedBlinks(page, limit, userId);
            return { page, limit, total, data: blinks };
        } catch (error) {
            console.error(error);
            throw { code: ErrorCodes.Blinks.FetchFailed };
        }
    }

    /**
     * Met à jour un Blink et son contenu
     */
    async updateBlink(blinkID, { contents }) {
        const transaction = await sequelize.transaction();
        try {
            const blink = await BlinkRepository.getBlinkById(blinkID);
            if (!blink) throw { code: ErrorCodes.Blinks.NotFound };

            await BlinkRepository.deleteBlinkContents(blinkID, transaction);
            await BlinkRepository.addBlinkContents(blinkID, contents, transaction);

            await transaction.commit();
            return blink;
        } catch (error) {
            await transaction.rollback();
            throw { code: error.code || ErrorCodes.Base.UnknownError };
        }
    }

    /**
     * Supprime un Blink et son contenu
     */
    async deleteBlink(blinkID) {
        return await BlinkRepository.deleteBlink(blinkID);
    }

    /**
     * Calcule le temps restant avant expiration d'un Blink
     */
    async calculateRemainingTime(blinkID) {
        const blink = await BlinkRepository.getBlinkHeaderById(blinkID);
        if (!blink) throw { code: ErrorCodes.Blinks.NotFound };

        const elapsedTime = (new Date() - blink.createdAt) / 1000; // Temps écoulé en secondes
        const initialLifetime = 86400; // 24h en secondes
        const likeBonus = blink.likeCount * 86.4;
        const commentBonus = blink.commentCount * 172.8;
        const dislikePenalty = blink.dislikeCount * 43.2;

        return Math.max(0, Math.min(initialLifetime + likeBonus + commentBonus - dislikePenalty - elapsedTime, initialLifetime));
    }

    /**
     * Supprime les Blinks expirés
     */
    async deleteExpiredBlinks() {
        const transaction = await sequelize.transaction();
        try {
            const blinks = await BlinkRepository.getAllBlinks(transaction);
            let deletedCount = 0;

            for (const blink of blinks) {
                const remainingTime = await this.calculateRemainingTime(blink.blinkID);
                if (remainingTime === 0) {
                    console.log(`🗑️ Suppression du Blink ${blink.blinkID} (temps restant : ${remainingTime}s)`);
                    await BlinkRepository.deleteBlink(blink.blinkID, transaction);
                    deletedCount++;
                }
            }

            await transaction.commit();
            console.log(`✅ ${deletedCount} Blink(s) expiré(s) supprimé(s).`);
        } catch (error) {
            await transaction.rollback();
            console.error("❌ Erreur lors de la suppression des Blinks expirés :", error);
        }
    }

    async searchBlinksAndUsers(query, page = 1, limit = 10) {
        try {
            if (!query || query.trim() === "") {
                throw { code: ErrorCodes.Blinks.InvalidSearchQuery };
            }

            return await BlinkRepository.searchBlinksAndUsers(query, Number(page), Number(limit));
        } catch (error) {
            console.error(error);
            throw { code: ErrorCodes.Blinks.SearchFailed };
        }
    }
}

module.exports = new BlinkService();