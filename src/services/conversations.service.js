const Conversations = require('../models/conversations');
const Messages = require('../models/messages');
const Profiles = require('../models/profiles');
const { sequelize } = require('../core/postgres');
const { Op } = require('sequelize');

class ConversationService {
    /**
     * Crée une nouvelle conversation entre deux utilisateurs
     * @param {string[]} participants - Tableau des IDs des participants
     * @returns {Promise<Object>} La conversation créée
     */
    async createConversation(participants) {
        // Vérifier qu'il y a au moins 2 participants
        if (!participants || participants.length < 2) {
            throw new Error('Une conversation doit avoir au moins 2 participants');
        }

        // Vérifier si une conversation existe déjà entre ces participants
        const existingConversation = await this.findConversationByParticipants(participants);
        if (existingConversation) {
            return existingConversation;
        }

        // Créer une nouvelle conversation
        return await Conversations.create({
            participants
        });
    }

    /**
     * Trouve une conversation par son ID
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Object|null>} La conversation trouvée ou null
     */
    async findConversationById(conversationID) {
        return await Conversations.findByPk(conversationID);
    }

    /**
     * Trouve une conversation entre des participants spécifiques
     * @param {string[]} participants - Tableau des IDs des participants
     * @returns {Promise<Object|null>} La conversation trouvée ou null
     */
    async findConversationByParticipants(participants) {
        // Trier les participants pour assurer une recherche cohérente
        const sortedParticipants = [...participants].sort();

        // Rechercher toutes les conversations qui pourraient correspondre
        const conversations = await Conversations.findAll();

        // Filtrer pour trouver une conversation avec exactement ces participants
        return conversations.find(conversation => {
            const convParticipants = [...conversation.participants].sort();
            return convParticipants.length === sortedParticipants.length &&
                   convParticipants.every((p, i) => p === sortedParticipants[i]);
        });
    }

    /**
     * Récupère toutes les conversations d'un utilisateur avec les informations sur le dernier message
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Array>} Liste des conversations avec les détails
     */
    async getUserConversations(userID) {
        // Récupérer toutes les conversations où l'utilisateur est participant
        const conversations = await Conversations.findAll({
            where: {
                participants: {
                    [Op.contains]: [userID]
                }
            },
            order: [['updatedAt', 'DESC']]
        });

        // Pour chaque conversation, récupérer les informations supplémentaires
        const result = await Promise.all(conversations.map(async (conversation) => {
            // Trouver l'autre participant (pour les conversations à 2 personnes)
            const otherParticipantID = conversation.participants.find(p => p !== userID);

            // Récupérer le profil de l'autre participant
            const profile = await Profiles.findOne({
                where: { userID: otherParticipantID },
                attributes: ['userID', 'username', 'display_name', 'avatar_url']
            });

            // Récupérer le dernier message de la conversation
            const lastMessage = await Messages.findOne({
                where: { conversationID: conversation.conversationID },
                order: [['createdAt', 'DESC']],
                attributes: ['content', 'createdAt', 'isRead']
            });

            // Compter les messages non lus
            const unreadCount = await Messages.count({
                where: {
                    conversationID: conversation.conversationID,
                    isRead: false,
                    expiresAt: { [Op.gt]: new Date() }
                }
            });

            // Construire l'objet de réponse
            return {
                conversationID: conversation.conversationID,
                userID: otherParticipantID,
                username: profile?.username,
                display_name: profile?.display_name,
                avatar_url: profile?.avatar_url,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    read: lastMessage.isRead
                } : null,
                unreadCount
            };
        }));

        return result;
    }
}

module.exports = new ConversationService();
