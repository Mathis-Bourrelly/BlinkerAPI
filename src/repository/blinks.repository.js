const Blinks = require('../models/blinks');
const BlinkContents = require('../models/blinkContents');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');

class BlinkRepository {
    /**
     * Crée un Blink
     */
    async createBlink(userID, transaction) {
        try {
            return await Blinks.create({ userID }, { transaction });
        } catch (error) {
            throw { code: ErrorCodes.Blinks.CreationFailed };
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
                throw { code: ErrorCodes.Blinks.InvalidContentType };
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
            throw { code: ErrorCodes.Blinks.ContentAdditionFailed };
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
            throw { code: ErrorCodes.Blinks.NotFound };
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
            throw { code: ErrorCodes.Blinks.NotFound };
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
    async getPaginatedBlinks(page, limit) {
        const offset = (page - 1) * limit;

        const { count, rows } = await Blinks.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [{ model: BlinkContents, as: 'contents' }]
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
            throw { code: ErrorCodes.Blinks.ContentsDeletionFailed };
        }
    }

    /**
     * Supprime un Blink
     */
    async deleteBlink(blinkID) {
        try {
            return await Blinks.destroy({ where: { blinkID } });
        } catch (error) {
            throw { code: ErrorCodes.Blinks.DeletionFailed };
        }
    }
}

module.exports = new BlinkRepository();
