const Blinks = require('../models/blinks');
const BlinkContents = require('../models/blinkContents');
const Profiles = require('../models/profiles');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');
const {Op} = require("sequelize");
const BaseRepository = require('./base.repository');
const { normalizePaginationParams, formatPaginatedResponse } = require('../utils/pagination.utils');

class BlinkRepository extends BaseRepository {
    constructor() {
        super(Blinks, ErrorCodes.Blinks);
    }
    /**
     * Crée un Blink
     */
    async createBlink(userID, transaction) {
        return this.create({ userID }, { transaction });
    }

    async createBlinkWithDate(userID, createdAt, transaction) {
        return this.create({ userID, createdAt }, { transaction });
    }

    /**
     * Ajoute du contenu à un Blink
     */
    async addBlinkContents(blinkID, contents, transaction) {
        const allowedContentTypes = ['text', 'image', 'video'];

        // Vérification des types de contenu
        contents.forEach(content => {
            if (!allowedContentTypes.includes(content.contentType)) {
                throw { message: ErrorCodes.Blinks.InvalidContentType };
            }
        });

        const mappedContents = contents.map(content => ({
            blinkID,
            contentType: content.contentType,
            content: content.content,
            position: content.position
        }));

        try {
            await BlinkContents.bulkCreate(mappedContents, { transaction });
        } catch (error) {
            throw { message: ErrorCodes.Blinks.ContentAdditionFailed };
        }
    }

    /**
     * Récupère un Blink avec son contenu
     */
    async getBlinkById(blinkID) {
        const blink = await Blinks.findOne({
            where: { blinkID },
            include: [{ model: BlinkContents, as: 'contents' }]
        });

        if (!blink) {
            throw { message: ErrorCodes.Blinks.NotFound };
        }

        return blink;
    }

    /**
     * Récupère uniquement l'entête d'un Blink
     */
    async getBlinkHeaderById(blinkID) {
        const blink = await Blinks.findOne({
            where: { blinkID }
        });

        if (!blink) {
            throw { message: ErrorCodes.Blinks.NotFound };
        }

        return blink;
    }

    /**
     * Récupère tous les Blinks
     */
    async getAllBlinks(transaction) {
        return this.findAll({ transaction });
    }

    /**
     * Récupère les Blinks avec pagination
     * @param {number} page - Numéro de la page
     * @param {number} limit - Nombre d'éléments par page
     * @param {string} userId - ID de l'utilisateur (optionnel)
     * @param {string} currentUserId - ID de l'utilisateur courant (optionnel)
     * @returns {Promise<Object>} Résultat paginé
     */
    async getPaginatedBlinks(page, limit, userId = null, currentUserId = null) {
        const { offset, limit: normalizedLimit } = normalizePaginationParams({ page, limit });
        const whereClause = userId ? { userID: userId } : {};

        const { count, rows } = await Blinks.findAndCountAll({
            where: whereClause,
            limit: normalizedLimit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: BlinkContents,
                    as: 'contents'
                },
                {
                    model: Profiles,
                    as: 'profile',
                    attributes: ['display_name', 'username', 'avatar_url', "userID"]
                },
                {
                    model: sequelize.models.Users,
                    as: 'likedByUsers',
                    attributes: ['userID'],
                    through: {
                        attributes: ['reactionType'],
                        where: currentUserId ? { userID: currentUserId, reactionType: 'like' } : {}
                    },
                    required: false
                }
            ]
        });

        // Transformer les résultats pour avoir un champ isLiked
        const blinks = rows.map(blink => {
            const blinkJson = blink.toJSON();
            blinkJson.isLiked = blinkJson.likedByUsers && blinkJson.likedByUsers.length > 0;
            delete blinkJson.likedByUsers;
            return blinkJson;
        });

        return formatPaginatedResponse({
            page,
            limit: normalizedLimit,
            total: count,
            data: blinks
        });
    }

    /**
     * Supprime tous les contenus d'un Blink
     */
    async deleteBlinkContents(blinkID, transaction) {
        try {
            return await BlinkContents.destroy({ where: { blinkID }, transaction });
        } catch (error) {
            throw { message: ErrorCodes.Blinks.ContentsDeletionFailed };
        }
    }

    /**
     * Supprime un Blink
     */
    async deleteBlink(blinkID, transaction) {
        return this.delete(blinkID, { transaction });
    }

    async searchBlinksAndUsers(query, page = 1, limit = 10) {
        const { offset, limit: normalizedLimit } = normalizePaginationParams({ page, limit });

        // Recherche dans les profils (display_name et username)
        const users = await Profiles.findAll({
            where: {
                [Op.or]: [
                    { display_name: { [Op.iLike]: `%${query}%` } },
                    { username: { [Op.iLike]: `%${query}%` } }
                ]
            },
            attributes: ['userID', 'display_name', 'username', 'avatar_url'],
            limit: normalizedLimit,
            offset
        });

        // Recherche dans les Blinks (contenu texte uniquement)
        const blinks = await BlinkContents.findAll({
            where: {
                contentType: 'text', // On ne recherche que dans les Blinks texte
                content: { [Op.iLike]: `%${query}%` }
            },
            include: [
                {
                    model: Blinks,
                    as: 'Blink',
                    attributes: ['blinkID', 'createdAt'],
                    include: [
                        {
                            model: Profiles,
                            as: 'profile',
                            attributes: ['display_name', 'username', 'avatar_url']
                        }
                    ]
                }
            ],
            limit,
            offset
        });

        return { users, blinks };
    }

    async getBlinksByUser(userID) {
        return await Blinks.findAll({
            where: { userID },
            attributes: ['blinkID', 'createdAt', 'likeCount', 'commentCount', 'dislikeCount', 'tier']
        });
    }

    /**
     * Récupère les blinks likés par un utilisateur
     */
    async getLikedBlinks(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const { count, rows } = await Blinks.findAndCountAll({
            include: [
                {
                    model: BlinkContents,
                    as: 'contents'
                },
                {
                    model: Profiles,
                    as: 'profile',
                    attributes: ['display_name', 'username', 'avatar_url', "userID"]
                },
                {
                    model: sequelize.models.Users,
                    as: 'likedByUsers',
                    attributes: ['userID'],
                    through: {
                        attributes: ['reactionType'],
                        where: { userID: userId, reactionType: 'like' }
                    },
                    required: true
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        // Transformer les résultats pour avoir un champ isLiked
        const blinks = rows.map(blink => {
            const blinkJson = blink.toJSON();
            blinkJson.isLiked = true;
            delete blinkJson.likedByUsers;
            return blinkJson;
        });

        return { total: count, blinks };
    }
}

module.exports = new BlinkRepository();
