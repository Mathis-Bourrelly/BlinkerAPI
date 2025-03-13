const BlinkRepository = require('../repository/blinks.repository.js');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');
const TIER_LEVELS = require('../../constants/tierLevels');

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
            throw { message: error.message || ErrorCodes.Base.UnknownError };
        }
    }

    async createBlinkWithContentAndDate({ userID, contents, date }) {
        const transaction = await sequelize.transaction();
        try {
            const blink = await BlinkRepository.createBlinkWithDate(userID, date, transaction);
            await BlinkRepository.addBlinkContents(blink.blinkID, contents, transaction);
            await transaction.commit();
            return blink;
        } catch (error) {
            await transaction.rollback();
            throw { message: error.message || ErrorCodes.Base.UnknownError };
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
            throw { message: ErrorCodes.Blinks.FetchFailed };
        }
    }

    /**
     * Met à jour un Blink et son contenu
     */
    async updateBlink(blinkID, { contents }) {
        const transaction = await sequelize.transaction();
        try {
            const blink = await BlinkRepository.getBlinkById(blinkID);
            if (!blink) throw { message: ErrorCodes.Blinks.NotFound };

            await BlinkRepository.deleteBlinkContents(blinkID, transaction);
            await BlinkRepository.addBlinkContents(blinkID, contents, transaction);

            await this.updateBlinkTier(blinkID);

            await transaction.commit();
            return blink;
        } catch (error) {
            await transaction.rollback();
            throw { message: error.message || ErrorCodes.Base.UnknownError };
        }
    }

    /**
     * Supprime un Blink et son contenu
     */
    async deleteBlink(blinkID) {
        return await BlinkRepository.deleteBlink(blinkID);
    }

    /**
     * Calcule le temps restant avant expiration d'un Blink en fonction du palier
     */
    async calculateRemainingTime(blinkID) {
        const blink = await BlinkRepository.getBlinkHeaderById(blinkID);
        if (!blink) throw { message: ErrorCodes.Blinks.NotFound };

        if (blink.tier === 'gold') return Infinity;

        const elapsedTime = (new Date() - blink.createdAt) / 1000; // Temps écoulé en secondes
        let baseLifetime = 86400; // 24h en secondes

        switch (blink.tier) {
            case 'bronze': baseLifetime += 30 * 86400; break; // +1 mois
            case 'silver': baseLifetime += 365 * 86400; break; // +1 an
        }

        const likeBonus = blink.likeCount * 86.4;
        const commentBonus = blink.commentCount * 172.8;
        const dislikePenalty = blink.dislikeCount * 43.2;

        return Math.max(0, baseLifetime + likeBonus + commentBonus - dislikePenalty - elapsedTime);
    }

    /**
     * Met à jour le palier (tier) d'un Blink en fonction de son nombre de likes
     */
    async updateBlinkTier(blinkID) {
        const blink = await BlinkRepository.getBlinkById(blinkID);
        if (!blink) return;

        for (const { tier, likes } of TIER_LEVELS) {
            if (blink.likeCount >= likes && blink.tier !== tier) {
                blink.tier = tier;
                await blink.save();
                break;
            }
        }
    }

    /**
     * Supprime les Blinks expirés (sauf ceux avec le palier "gold")
     */
    async deleteExpiredBlinks() {
        const transaction = await sequelize.transaction();
        try {
            const blinks = await BlinkRepository.getAllBlinks(transaction);
            let deletedCount = 0;

            for (const blink of blinks) {
                const remainingTime = await this.calculateRemainingTime(blink.blinkID);

                if (remainingTime === 0 && blink.tier !== 'gold') {
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

    /**
     * Recherche des Blinks et des utilisateurs par mot-clé
     */
    async searchBlinksAndUsers(query, page = 1, limit = 10) {
        try {
            if (!query || query.trim() === "") {
                throw { message: ErrorCodes.Blinks.InvalidSearchQuery };
            }

            return await BlinkRepository.searchBlinksAndUsers(query, Number(page), Number(limit));
        } catch (error) {
            console.error(error);
            throw { message: ErrorCodes.Blinks.SearchFailed };
        }
    }

    async getUserScore(userID) {
        const blinks = await BlinkRepository.getBlinksByUser(userID);
        if (!blinks || blinks.length === 0) return 0;

        let totalDuration = 0;

        for (const blink of blinks) {
            const remainingTime = await this.calculateRemainingTime(blink.blinkID);
            totalDuration += remainingTime;
        }

        return Math.round(totalDuration / blinks.length);
    }

}

module.exports = new BlinkService();