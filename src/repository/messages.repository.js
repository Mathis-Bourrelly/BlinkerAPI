const Messages = require('../models/messages');
const Conversations = require('../models/conversations');
const Profiles = require('../models/profiles');
const Users = require('../models/users');
const { Op } = require('sequelize');

class MessagesRepository {
    /**
     * Crée un nouveau message
     * @param {Object} messageData - Données du message
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} Le message créé
     */
    async createMessage(messageData, options = {}) {
        return await Messages.create(messageData, options);
    }

    /**
     * Récupère les messages d'une conversation
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Array>} Liste des messages non expirés
     */
    async getConversationMessages(conversationID) {
        return await Messages.findAll({
            where: {
                conversationID,
                expiresAt: { [Op.gt]: new Date() }
            },
            include: [{
                model: Users,
                as: 'sender',
                attributes: ['userID', 'email']
            }],
            order: [['createdAt', 'ASC']]
        });
    }

    /**
     * Récupère les messages non lus pour un ensemble de conversations
     * @param {string[]} conversationIDs - Liste des IDs de conversations
     * @returns {Promise<Array>} Liste des messages non lus
     */
    async getUnreadMessages(conversationIDs) {
        return await Messages.findAll({
            where: {
                conversationID: { [Op.in]: conversationIDs },
                isRead: false,
                expiresAt: { [Op.gt]: new Date() }
            },
            include: [{
                model: Users,
                as: 'sender',
                attributes: ['userID', 'email']
            }],
            order: [['createdAt', 'ASC']]
        });
    }

    /**
     * Compte les messages non lus dans une conversation
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<number>} Nombre de messages non lus
     */
    async countUnreadMessages(conversationID) {
        return await Messages.count({
            where: {
                conversationID,
                isRead: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });
    }

    /**
     * Récupère le dernier message d'une conversation
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Object|null>} Le dernier message ou null
     */
    async getLastMessage(conversationID) {
        return await Messages.findOne({
            where: { conversationID },
            order: [['createdAt', 'DESC']],
            attributes: ['content', 'createdAt', 'isRead'],
            include: [{
                model: Users,
                as: 'sender',
                attributes: ['userID', 'email']
            }]
        });
    }

    /**
     * Marque les messages d'une conversation comme lus
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Array>} Résultat de l'opération
     */
    async markAsRead(conversationID) {
        return await Messages.update(
            { isRead: true },
            {
                where: {
                    conversationID,
                    isRead: false,
                    expiresAt: { [Op.gt]: new Date() }
                }
            }
        );
    }

    /**
     * Supprime les messages expirés
     * @returns {Promise<number>} Nombre de messages supprimés
     */
    async deleteExpiredMessages() {
        return await Messages.destroy({
            where: {
                expiresAt: { [Op.lt]: new Date() }
            }
        });
    }

    /**
     * Récupère les profils des participants avec leurs scores
     * @param {string[]} participantIDs - Liste des IDs des participants
     * @returns {Promise<Array>} Liste des profils
     */
    async getParticipantsProfiles(participantIDs) {
        return await Profiles.findAll({
            where: { userID: { [Op.in]: participantIDs } },
            attributes: ['userID', 'score']
        });
    }
}

module.exports = new MessagesRepository();
