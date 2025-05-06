const BlinkRepository = require('../repository/blinks.repository.js');
const BlinkLifetimesRepository = require('../repository/blinkLifetimes.repository.js');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');
const TIER_LEVELS = require('../../constants/tierLevels');
const { buildAvatarUrl } = require('../utils/url.utils');
const { createError, withTransaction } = require('../utils/error.utils');
require('dotenv').config();

// Import du service utilisateur pour la mise à jour des scores
const UsersService = require('./users.service');

class BlinkService {
    /**
     * Crée un Blink avec son contenu
     */
    async createBlinkWithContent({ userID, contents, skipScoreUpdate = false }) {
        return await withTransaction(async (transaction) => {
            const blink = await BlinkRepository.createBlink(userID, transaction);
            await BlinkRepository.addBlinkContents(blink.blinkID, contents, transaction);

            // Mettre à jour le score de l'utilisateur après la création du blink
            // Sauf si on demande explicitement de sauter cette étape (utile pour le seeding)
            if (!skipScoreUpdate) {
                try {
                    await UsersService.updateUserScore(userID);
                } catch (error) {
                    console.warn(`Impossible de mettre à jour le score de l'utilisateur ${userID}:`, error.message);
                }
            }

            return blink;
        }, sequelize, ErrorCodes.Blinks.CreationFailed);
    }

    async createBlinkWithContentAndDate({ userID, contents, date, skipScoreUpdate = false }) {
        return await withTransaction(async (transaction) => {
            const blink = await BlinkRepository.createBlinkWithDate(userID, date, transaction);
            await BlinkRepository.addBlinkContents(blink.blinkID, contents, transaction);

            // Mettre à jour le score de l'utilisateur après la création du blink
            // Sauf si on demande explicitement de sauter cette étape (utile pour le seeding)
            if (!skipScoreUpdate) {
                try {
                    await UsersService.updateUserScore(userID);
                } catch (error) {
                    console.warn(`Impossible de mettre à jour le score de l'utilisateur ${userID}:`, error.message);
                }
            }

            return blink;
        }, sequelize, ErrorCodes.Blinks.CreationFailed);
    }

    /**
     * Récupère un Blink par son ID
     * @param {string} blinkID - ID du blink à récupérer
     * @param {string} currentUserId - ID de l'utilisateur courant (optionnel)
     * @returns {Promise<Object>} Le blink avec les informations de like/dislike si currentUserId est fourni
     */
    async getBlinkById(blinkID, currentUserId = null) {
        return await BlinkRepository.getBlinkById(blinkID, currentUserId);
    }

    /**
     * Construit l'URL complète pour un avatar
     * @param {string} avatarFilename - Nom du fichier de l'avatar
     * @returns {string} URL complète de l'avatar
     * @deprecated Utiliser la fonction buildAvatarUrl du module url.utils à la place
     */
    _constructProfileUrl(avatarFilename) {
        return buildAvatarUrl(avatarFilename);
    }

    /**
     * Récupère les Blinks paginés
     */
    async getPaginatedBlinks(page = 1, limit = 10, userId = null, currentUserId = null) {
        try {
            const result = await BlinkRepository.getPaginatedBlinks(page, limit, userId, currentUserId);
            const { data: blinks } = result;

            // Transformer les URLs des avatars pour inclure l'URL complète
            const transformedBlinks = blinks.map(blink => {
                const blinkData = blink.toJSON ? blink.toJSON() : blink;

                // Si le blink a un profil avec un avatar_url, construire l'URL complète
                if (blinkData.profile && blinkData.profile.avatar_url) {
                    blinkData.profile.avatar_url = buildAvatarUrl(blinkData.profile.avatar_url);
                }

                return blinkData;
            });

            // Retourner le résultat dans le même format que le repository
            return {
                ...result,
                data: transformedBlinks
            };
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
            const result = await BlinkRepository.getLikedBlinks(userId, page, limit);
            const { data: blinks } = result;

            // Transformer les URLs des avatars pour inclure l'URL complète
            const transformedBlinks = blinks.map(blink => {
                const blinkData = blink.toJSON ? blink.toJSON() : blink;

                // Si le blink a un profil avec un avatar_url, construire l'URL complète
                if (blinkData.profile && blinkData.profile.avatar_url) {
                    blinkData.profile.avatar_url = buildAvatarUrl(blinkData.profile.avatar_url);
                }

                return blinkData;
            });

            // Retourner le résultat dans le même format que le repository
            return {
                ...result,
                data: transformedBlinks
            };
        } catch (error) {
            console.error(error);
            throw { message: ErrorCodes.Blinks.FetchFailed };
        }
    }

    /**
     * Met à jour un Blink et son contenu
     */
    async updateBlink(blinkID, { contents }) {
        const blink = await BlinkRepository.getBlinkById(blinkID);
        if (!blink) throw createError(ErrorCodes.Blinks.NotFound);

        return await withTransaction(async (transaction) => {
            await BlinkRepository.deleteBlinkContents(blinkID, transaction);
            await BlinkRepository.addBlinkContents(blinkID, contents, transaction);

            await this.updateBlinkTier(blinkID);

            // Mettre à jour le score de l'utilisateur après la mise à jour du blink
            try {
                await UsersService.updateUserScore(blink.userID);
            } catch (error) {
                console.warn(`Impossible de mettre à jour le score de l'utilisateur ${blink.userID}:`, error.message);
            }

            return blink;
        }, sequelize, ErrorCodes.Blinks.UpdateFailed);
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

            // Enregistrer la durée de vie dans la table BlinkLifetimes via le repository
            await BlinkLifetimesRepository.recordBlinkLifetime({
                userID: blink.userID,
                blinkID: blink.blinkID,
                createdAt: createdAt,
                deletedAt: deletedAt,
                lifetime: lifetime
            }, transaction);

            // Mettre à jour le score de l'utilisateur
            try {
                await UsersService.updateUserScore(blink.userID);
            } catch (error) {
                console.warn(`Impossible de mettre à jour le score de l'utilisateur ${blink.userID}:`, error.message);
            }

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
        return await withTransaction(async (transaction) => {
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

            console.log(`✅ ${deletedCount} Blink(s) expiré(s) supprimé(s).`);
            return deletedCount;
        }, sequelize).catch(error => {
            console.error("❌ Erreur lors de la suppression des Blinks expirés :", error);
            return 0;
        });
    }

    /**
     * Recherche des Blinks et des utilisateurs par mot-clé
     */
    async searchBlinksAndUsers(query, page = 1, limit = 10) {
        try {
            if (!query || query.trim() === "") {
                throw createError(ErrorCodes.Blinks.InvalidSearchQuery);
            }

            const result = await BlinkRepository.searchBlinksAndUsers(query, Number(page), Number(limit));

            // Vérifier si le résultat est au nouveau format
            if (result.data) {
                // Nouveau format avec data
                const { data } = result;

                // Transformer les données si nécessaire
                if (data.users && data.users.length > 0) {
                    data.users = data.users.map(user => {
                        const userData = user.toJSON ? user.toJSON() : user;
                        if (userData.avatar_url) {
                            userData.avatar_url = buildAvatarUrl(userData.avatar_url);
                        }
                        return userData;
                    });
                }

                if (data.blinks && data.blinks.length > 0) {
                    data.blinks = data.blinks.map(blink => {
                        const blinkData = blink.toJSON ? blink.toJSON() : blink;
                        if (blinkData.Blink && blinkData.Blink.profile && blinkData.Blink.profile.avatar_url) {
                            blinkData.Blink.profile.avatar_url = buildAvatarUrl(blinkData.Blink.profile.avatar_url);
                        }
                        return blinkData;
                    });
                }

                return result;
            } else {
                // Ancien format
                // Transformer les URLs des avatars pour les utilisateurs
                if (result.users && result.users.length > 0) {
                    result.users = result.users.map(user => {
                        const userData = user.toJSON ? user.toJSON() : user;
                        if (userData.avatar_url) {
                            userData.avatar_url = buildAvatarUrl(userData.avatar_url);
                        }
                        return userData;
                    });
                }

                // Transformer les URLs des avatars pour les blinks
                if (result.blinks && result.blinks.length > 0) {
                    result.blinks = result.blinks.map(blink => {
                        const blinkData = blink.toJSON ? blink.toJSON() : blink;
                        if (blinkData.Blink && blinkData.Blink.profile && blinkData.Blink.profile.avatar_url) {
                            blinkData.Blink.profile.avatar_url = buildAvatarUrl(blinkData.Blink.profile.avatar_url);
                        }
                        return blinkData;
                    });
                }

                return result;
            }
        } catch (error) {
            console.error(error);
            throw createError(ErrorCodes.Blinks.SearchFailed, error);
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