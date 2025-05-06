const Messages = require('../models/messages');
const Conversations = require('../models/conversations');
const Profiles = require('../models/profiles');
const Users = require('../models/users');
const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const ErrorCodes = require('../../constants/errorCodes');

class MessagesRepository extends BaseRepository {
    constructor() {
        super(Messages, ErrorCodes.Messages);
    }
    /**
     * Crée un nouveau message
     * @param {Object} messageData - Données du message
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} Le message créé
     */
    async createMessage(messageData, options = {}) {
        return this.create(messageData, options);
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
     * Marque les messages d'une conversation comme lus pour un utilisateur spécifique
     * @param {string} conversationID - ID de la conversation
     * @param {string} userID - ID de l'utilisateur qui marque les messages comme lus
     * @returns {Promise<Array>} Résultat de l'opération
     */
    async markAsRead(conversationID, userID) {
        return await Messages.update(
            { isRead: true },
            {
                where: {
                    conversationID,
                    isRead: false,
                    expiresAt: { [Op.gt]: new Date() },
                    senderID: { [Op.ne]: userID } // Ne marquer comme lus que les messages envoyés par d'autres utilisateurs
                }
            }
        );
    }

    /**
     * Récupère les messages expirés
     * @returns {Promise<Array>} Liste des messages expirés
     */
    async getExpiredMessages() {
        try {
            return await Messages.findAll({
                where: {
                    expiresAt: { [Op.lt]: new Date() }
                },
                include: [{
                    model: Users,
                    as: 'sender',
                    attributes: ['userID', 'email']
                }]
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des messages expirés:', error);
            return [];
        }
    }

    /**
     * Supprime les messages expirés
     * @returns {Promise<number>} Nombre de messages supprimés
     */
    async deleteExpiredMessages() {
        try {
            return await Messages.destroy({
                where: {
                    expiresAt: { [Op.lt]: new Date() }
                }
            });
        } catch (error) {
            throw { message: ErrorCodes.Messages?.DeletionFailed || 'Failed to delete expired messages' };
        }
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
