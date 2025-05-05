const Conversations = require('../models/conversations');
const Messages = require('../models/messages');
const Profiles = require('../models/profiles');
const { Op } = require('sequelize');

class ConversationsRepository {
    /**
     * Crée une nouvelle conversation
     * @param {string[]} participants - Tableau des IDs des participants
     * @returns {Promise<Object>} La conversation créée
     */
    async createConversation(participants) {
        return await Conversations.create({
            participants
        });
    }

    /**
     * Trouve une conversation par son ID
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Object|null>} La conversation trouvée ou null
     */
    async findById(conversationID) {
        return await Conversations.findByPk(conversationID);
    }

    /**
     * Récupère toutes les conversations
     * @returns {Promise<Array>} Liste de toutes les conversations
     */
    async findAll() {
        return await Conversations.findAll();
    }

    /**
     * Récupère toutes les conversations d'un utilisateur
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Array>} Liste des conversations
     */
    async findByParticipant(userID) {
        return await Conversations.findAll({
            where: {
                participants: {
                    [Op.contains]: [userID]
                }
            },
            order: [['updatedAt', 'DESC']]
        });
    }

    /**
     * Met à jour une conversation
     * @param {string} conversationID - ID de la conversation
     * @param {Object} updates - Champs à mettre à jour
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} Résultat de la mise à jour
     */
    async update(conversationID, updates, options = {}) {
        const conversation = await this.findById(conversationID);
        if (!conversation) {
            throw new Error('Conversation non trouvée');
        }
        return await conversation.update(updates, options);
    }

    /**
     * Récupère le profil d'un participant
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Object|null>} Le profil trouvé ou null
     */
    async getParticipantProfile(userID) {
        return await Profiles.findOne({
            where: { userID },
            attributes: ['userID', 'username', 'display_name', 'avatar_url']
        });
    }
}

module.exports = new ConversationsRepository();
