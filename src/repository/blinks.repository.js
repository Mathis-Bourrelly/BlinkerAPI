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
        const formattedContents = contents.map((content, index) => ({
            blinkID,
            contentType: content.type,
            content: content.value,
            position: index
        }));

        return await BlinkContents.bulkCreate(formattedContents, { transaction });
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

    /**
     * Supprime tous les contenus d’un Blink
     */
    async deleteBlinkContents(blinkID, transaction) {
        return await BlinkContents.destroy({ where: { blinkID } }, { transaction });
    }

    /**
     * Supprime un Blink
     */
    async deleteBlink(blinkID) {
        return await Blinks.destroy({ where: { blinkID } });
    }
}

module.exports = new BlinkRepository();
