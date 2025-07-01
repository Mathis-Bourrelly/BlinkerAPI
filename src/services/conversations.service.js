const ConversationsRepository = require('../repository/conversations.repository');
const MessagesRepository = require('../repository/messages.repository');
const { sequelize } = require('../core/postgres');
const { buildAvatarUrl } = require('../utils/url.utils');
require('dotenv').config();

class ConversationService {
    /**
     * Construit l'URL complète de l'avatar à partir du nom du fichier.
     * @param {string} filename - Nom du fichier de l'avatar.
     * @returns {string} URL complète de l'avatar.
     * @deprecated Utiliser la fonction buildAvatarUrl du module url.utils à la place
     */
    buildAvatarUrl(filename) {
        return buildAvatarUrl(filename);
    }
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

        // Créer une nouvelle conversation via le repository
        return await ConversationsRepository.createConversation(participants);
    }

    /**
     * Trouve une conversation par son ID
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Object|null>} La conversation trouvée ou null
     */
    async findConversationById(conversationID) {
        return await ConversationsRepository.findById(conversationID);
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
        const conversations = await ConversationsRepository.findAll();

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
        const conversations = await ConversationsRepository.findByParticipant(userID);

        // Pour chaque conversation, récupérer les informations supplémentaires
        const result = await Promise.all(conversations.map(async (conversation) => {
            // Trouver l'autre participant (pour les conversations à 2 personnes)
            const otherParticipantID = conversation.participants.find(p => p !== userID);

            // Récupérer le profil de l'autre participant
            const profile = await ConversationsRepository.getParticipantProfile(otherParticipantID);

            // Récupérer le dernier message de la conversation
            const lastMessage = await MessagesRepository.getLastMessage(conversation.conversationID);

            // Déterminer si le dernier message provient de l'utilisateur actuel
            const isFromUser = lastMessage?.senderID === userID;

            // Compter les messages non lus
            // Si le dernier message provient de l'utilisateur actuel, on considère qu'il n'y a pas de messages non lus
            let unreadCount = isFromUser ? 0 : await MessagesRepository.countUnreadMessages(conversation.conversationID);

            // Construire l'objet de réponse
            return {
                conversationID: conversation.conversationID,
                userID: otherParticipantID,
                username: profile?.username,
                display_name: profile?.display_name,
                avatar_url: profile?.avatar_url ? buildAvatarUrl(profile.avatar_url) : null,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    read: lastMessage.isRead,
                    isFromUser: isFromUser,
                    senderID: lastMessage.senderID
                } : null,
                unreadCount
            };
        }));

        return result;
    }
}

module.exports = new ConversationService();
