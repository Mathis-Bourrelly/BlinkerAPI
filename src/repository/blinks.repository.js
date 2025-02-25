const Blinks = require('../models/blinks');
const BlinkContents = require('../models/blinkContents');
const { sequelize } = require('../core/postgres');

class BlinkRepository {
    /**
     * Crée un Blink
     */
    async createBlink(userID, transaction) {
        return await Blinks.create({ userID }, { transaction });
    }

    /**
     * Ajoute du contenu à un Blink
     */
    async addBlinkContents(blinkID, contents, transaction) {
        const allowedContentTypes = ['text', 'image', 'video'];

        // Vérification des types de contenu
        contents.forEach(content => {
            if (!allowedContentTypes.includes(content.contentType)) {
                throw new Error(`Type de contenu invalide : ${content.contentType}`);
            }
        });

        const mappedContents = contents.map(content => ({
            blinkID,
            contentType: content.contentType,
            content: content.content,
            position: content.position
        }));

        console.log("Données insérées dans BlinkContents :", JSON.stringify(mappedContents, null, 2));

        await BlinkContents.bulkCreate(mappedContents, { transaction });
    }

    /**
     * Récupère un Blink avec son contenu
     */
    async getBlinkById(blinkID) {
        return await Blinks.findOne({
            where: { blinkID },
            include: [{ model: BlinkContents, as: 'contents' }]
        });
    }

    async getBlinkHeaderById(blinkID) {
        return await Blinks.findOne({
            where: { blinkID } // Récupère uniquement l'entête du Blink, sans contenu
        });
    }


    /**
     * Récupère tous les Blinks
     */
    async getAllBlinks(transaction) {
        return await Blinks.findAll({ transaction });
    }

    /**
     * Supprime tous les contenus d’un Blink
     */
    async deleteBlinkContents(blinkID, transaction) {
        return await BlinkContents.destroy({ where: { blinkID }, transaction });
    }

    /**
     * Supprime un Blink
     */
    async deleteBlink(blinkID) {
        return await Blinks.destroy({ where: { blinkID } });
    }
}

module.exports = new BlinkRepository();