const Messages = require('../models/messages');
const BlinkService = require('./blinks.service');
const { Op } = require("sequelize");

class MessagesService {
    /**
     * Envoie un message et définit sa durée de vie en fonction des scores des utilisateurs.
     */
    async sendMessage(senderID, receiverID, content) {
        const senderScore = await BlinkService.getUserScore(senderID);
        const receiverScore = await BlinkService.getUserScore(receiverID);

        // Calcul de la durée de vie en secondes (moyenne des scores)
        const averageLifetime = Math.max(Math.round((senderScore + receiverScore) / 2), 86400); // 1 jour minimum
        const expiresAt = new Date(Date.now() + averageLifetime * 1000);

        return await Messages.create({
            senderID,
            receiverID,
            content,
            expiresAt,
            isRead: false
        });
    }

    /**
     * Récupère les messages non expirés entre deux utilisateurs.
     */
    async getMessagesBetweenUsers(user1, user2) {
        return await Messages.findAll({
            where: {
                [Op.or]: [
                    { senderID: user1, receiverID: user2 },
                    { senderID: user2, receiverID: user1 }
                ],
                expiresAt: { [Op.gt]: new Date() }
            },
            order: [['createdAt', 'ASC']]
        });
    }

    /**
     * Récupère les messages non lus pour un utilisateur donné.
     */
    async getUnreadMessages(userID) {
        return await Messages.findAll({
            where: {
                receiverID: userID,
                isRead: false,
                expiresAt: { [Op.gt]: new Date() }
            },
            order: [['createdAt', 'ASC']]
        });
    }

    /**
     * Marque tous les messages entre un utilisateur et un autre comme lus.
     */
    async markMessagesAsRead(senderID, receiverID) {
        return await Messages.update(
            { isRead: true },
            {
                where: {
                    senderID,
                    receiverID,
                    isRead: false, // Seuls les messages non lus
                    expiresAt: { [Op.gt]: new Date() }
                }
            }
        );
    }

    /**
     * Supprime les messages expirés.
     */
    async deleteExpiredMessages() {
        await Messages.destroy({
            where: {
                expiresAt: { [Op.lt]: new Date() }
            }
        });
    }
}

module.exports = new MessagesService();