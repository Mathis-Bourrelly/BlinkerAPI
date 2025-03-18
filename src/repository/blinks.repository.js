const Blinks = require('../models/blinks');
const BlinkContents = require('../models/blinkContents');
const Profiles = require('../models/profiles');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');
const {Op} = require("sequelize");

class BlinkRepository {
    /**
     * Crée un Blink
     */
    async createBlink(userID, transaction) {
        try {
            return await Blinks.create({ userID }, { transaction });
        } catch (error) {
            throw { message: ErrorCodes.Blinks.CreationFailed };
        }
    }

    async createBlinkWithDate(userID, createdAt, transaction) {
        try {
            return await Blinks.create({ userID, createdAt}, { transaction });
        } catch (error) {
            throw { message: ErrorCodes.Blinks.CreationFailed };
        }
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
        return await Blinks.findAll({ transaction });
    }

    /**
     * Récupère les Blinks avec pagination
     */
    async getPaginatedBlinks(page, limit, userId = null) {
        const offset = (page - 1) * limit;
        const whereClause = userId ? { userID: userId } : {};

        const { count, rows } = await Blinks.findAndCountAll({
            where: whereClause,
            limit,
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
                }
            ]
        });
        return { total: count, blinks: rows };
    }

    /**
     * Supprime tous les contenus d’un Blink
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
    async deleteBlink(blinkID) {
        try {
            return await Blinks.destroy({ where: { blinkID } });
        } catch (error) {
            throw { message: ErrorCodes.Blinks.DeletionFailed };
        }
    }

    async searchBlinksAndUsers(query, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        // Recherche dans les profils (display_name et username)
        const users = await Profiles.findAll({
            where: {
                [Op.or]: [
                    { display_name: { [Op.iLike]: `%${query}%` } },
                    { username: { [Op.iLike]: `%${query}%` } }
                ]
            },
            attributes: ['userID', 'display_name', 'username', 'avatar_url'],
            limit,
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
}

module.exports = new BlinkRepository();
