const BlinkRepository = require('../repository/blinks.repository.js');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');
const TIER_LEVELS = require('../../constants/tierLevels');
require('dotenv').config();

// Import du service utilisateur pour la mise à jour des scores
const UsersService = require('./users.service');

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

            // Mettre à jour le score de l'utilisateur après la création du blink
            await UsersService.updateUserScore(userID);

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

            // Mettre à jour le score de l'utilisateur après la création du blink
            await UsersService.updateUserScore(userID);

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
     * Construit l'URL complète pour un avatar
     * @param {string} avatarFilename - Nom du fichier de l'avatar
     * @returns {string} URL complète de l'avatar
     */
    _constructProfileUrl(avatarFilename) {
        if (!avatarFilename) return null;

        // Toujours utiliser l'URL absolue du serveur API
        // En développement: http://localhost:3011
        // En production: https://dev.blinker.eterny.fr
        const apiUrl = process.env.API_URL ||
                      (process.env.NODE_ENV === 'production' ?
                       'https://dev.blinker.eterny.fr' :
                       'http://localhost:3011');

        return `${apiUrl}/uploads/${avatarFilename}`;
    }

    /**
     * Récupère les Blinks paginés
     */
    async getPaginatedBlinks(page = 1, limit = 10, userId = null, currentUserId = null) {
        try {
            const { total, blinks } = await BlinkRepository.getPaginatedBlinks(page, limit, userId, currentUserId);

            // Transformer les URLs des avatars pour inclure l'URL complète
            const transformedBlinks = blinks.map(blink => {
                const blinkData = blink.toJSON ? blink.toJSON() : blink;

                // Si le blink a un profil avec un avatar_url, construire l'URL complète
                if (blinkData.profile && blinkData.profile.avatar_url) {
                    blinkData.profile.avatar_url = this._constructProfileUrl(blinkData.profile.avatar_url);
                }

                return blinkData;
            });

            return { page, limit, total, data: transformedBlinks };
        } catch (error) {
            console.error(error);
            throw { message: ErrorCodes.Blinks.FetchFailed };
        }
    }

    /**
     * Récupère les blinks likés par un utilisateur
     */
    async getLikedBlinks(userId, page = 1, limit = 10) {
        try {
            const { total, blinks } = await BlinkRepository.getLikedBlinks(userId, page, limit);

            // Transformer les URLs des avatars pour inclure l'URL complète
            const transformedBlinks = blinks.map(blink => {
                const blinkData = blink.toJSON ? blink.toJSON() : blink;

                // Si le blink a un profil avec un avatar_url, construire l'URL complète
                if (blinkData.profile && blinkData.profile.avatar_url) {
                    blinkData.profile.avatar_url = this._constructProfileUrl(blinkData.profile.avatar_url);
                }

                return blinkData;
            });

            return { page, limit, total, data: transformedBlinks };
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

            // Mettre à jour le score de l'utilisateur après la mise à jour du blink
            await UsersService.updateUserScore(blink.userID);

            return blink;
        } catch (error) {
            await transaction.rollback();
            throw { message: error.message || ErrorCodes.Base.UnknownError };
        }
    }

    /**
     * Supprime un Blink et son contenu
     * @param {string} blinkID - ID du blink à supprimer
     * @param {Object} transaction - Transaction Sequelize (optionnelle)
     * @returns {Promise<Object>} Résultat de la suppression
     */
    async deleteBlink(blinkID, transaction = null) {
        try {
            // Récupérer le blink avant de le supprimer pour avoir ses informations
            const blink = await BlinkRepository.getBlinkById(blinkID);
            if (!blink) return null;

            // Calculer la durée de vie réelle du blink (en secondes)
            const createdAt = new Date(blink.createdAt);
            const deletedAt = new Date();
            const lifetime = Math.round((deletedAt - createdAt) / 1000);

            // Enregistrer la durée de vie dans la table BlinkLifetimes
            await sequelize.query(`
                INSERT INTO "BlinkLifetimes" ("userID", "blinkID", "createdAt", "deletedAt", "lifetime")
                VALUES (:userID, :blinkID, :createdAt, :deletedAt, :lifetime)
            `, {
                replacements: {
                    userID: blink.userID,
                    blinkID: blink.blinkID,
                    createdAt: createdAt,
                    deletedAt: deletedAt,
                    lifetime: lifetime
                },
                type: sequelize.QueryTypes.INSERT,
                transaction
            });

            // Mettre à jour le score de l'utilisateur
            const UsersService = require('./users.service');
            await UsersService.updateUserScore(blink.userID);

            // Supprimer le blink
            return await BlinkRepository.deleteBlink(blinkID, transaction);
        } catch (error) {
            console.error('Erreur lors de la suppression du blink:', error);
            throw error;
        }
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
                    await this.deleteBlink(blink.blinkID, transaction);
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

            const results = await BlinkRepository.searchBlinksAndUsers(query, Number(page), Number(limit));

            // Transformer les URLs des avatars pour les utilisateurs
            if (results.users && results.users.length > 0) {
                results.users = results.users.map(user => {
                    const userData = user.toJSON ? user.toJSON() : user;
                    if (userData.avatar_url) {
                        userData.avatar_url = this._constructProfileUrl(userData.avatar_url);
                    }
                    return userData;
                });
            }

            // Transformer les URLs des avatars pour les blinks
            if (results.blinks && results.blinks.length > 0) {
                results.blinks = results.blinks.map(blink => {
                    const blinkData = blink.toJSON ? blink.toJSON() : blink;
                    if (blinkData.Blink && blinkData.Blink.profile && blinkData.Blink.profile.avatar_url) {
                        blinkData.Blink.profile.avatar_url = this._constructProfileUrl(blinkData.Blink.profile.avatar_url);
                    }
                    return blinkData;
                });
            }

            return results;
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