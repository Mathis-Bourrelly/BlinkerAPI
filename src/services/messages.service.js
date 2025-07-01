const MessagesRepository = require('../repository/messages.repository');
// Import ConversationService lazily to avoid circular dependencies
let ConversationService;
const WebSocketService = require('./websocket.service');
const { sequelize } = require('../core/postgres');
const { createError, withTransaction } = require('../utils/error.utils');
const { logger } = require('../utils/logger.utils');

// Initialize ConversationService lazily
const getConversationService = () => {
    if (!ConversationService) {
        ConversationService = require('./conversations.service');
    }
    return ConversationService;
};

class MessagesService {
    /**
     * Envoie un message et définit sa durée de vie en fonction des scores des utilisateurs.
     * @param {string} userID - ID de l'utilisateur qui envoie le message
     * @param {string} receiverID - ID du destinataire (optionnel si conversationID est fourni)
     * @param {string} content - Contenu du message
     * @param {string} conversationID - ID de la conversation (optionnel, créé automatiquement si absent)
     * @returns {Promise<Object>} Le message créé
     */
    async sendMessage(userID, receiverID, content, conversationID = null) {
        let conversation;

        // Si conversationID est fourni, vérifier qu'elle existe
        if (conversationID) {
            conversation = await getConversationService().findConversationById(conversationID);
            if (!conversation) {
                throw createError('Conversation non trouvée');
            }

            // Vérifier que l'utilisateur fait partie de la conversation
            if (!conversation.participants.includes(userID)) {
                throw createError('L\'utilisateur ne fait pas partie de cette conversation');
            }
        } else if (receiverID) {
            // Créer ou récupérer une conversation entre ces deux utilisateurs
            conversation = await getConversationService().createConversation([userID, receiverID]);
            conversationID = conversation.conversationID;
        } else {
            throw createError('receiverID ou conversationID doit être fourni');
        }

        return await withTransaction(async (transaction) => {
            // Calcul de la durée de vie en fonction des scores stockés dans les profils
            const participants = conversation.participants;

            // Récupérer les profils des participants avec leurs scores
            const profiles = await MessagesRepository.getParticipantsProfiles(participants);

            // Extraire les scores des profils
            const scores = profiles.map(p => p.score);
            const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const averageLifetime = Math.max(Math.round(averageScore), 86400); // 1 jour minimum
            const expiresAt = new Date(Date.now() + averageLifetime * 1000);

            // Créer le message
            const messageData = {
                conversationID,
                content,
                expiresAt,
                isRead: false,
                senderID: userID // Ajouter l'ID de l'expéditeur
            };

            // Ajouter le receiverID uniquement s'il est fourni (pour les messages directs)
            if (receiverID) {
                messageData.receiverID = receiverID;
            }

            const message = await MessagesRepository.createMessage(messageData, { transaction });

            // Mettre à jour la date de mise à jour de la conversation
            await conversation.update({ updatedAt: new Date() }, { transaction });

            // Récupérer le message avec les informations de l'expéditeur
            const messageWithSender = await MessagesRepository.findById(message.messageID, {
                include: [{
                    model: sequelize.models.Users,
                    as: 'sender',
                    attributes: ['userID', 'email']
                }],
                transaction
            });

            // Notifier les autres participants via WebSocket (après la transaction)
            setTimeout(() => {
                try {
                    // Envoyer uniquement des notifications individuelles aux participants
                    // pour éviter les doublons d'événements
                    conversation.participants.forEach(participantID => {
                        // Envoyer la notification à tous les participants, y compris l'expéditeur
                        // pour assurer la cohérence des données
                        WebSocketService.notifyNewMessage(participantID, messageWithSender, conversationID);
                    });
                    logger.info(`Notification de nouveau message envoyée pour la conversation ${conversationID}`);
                } catch (error) {
                    logger.error(`Erreur lors de la notification WebSocket: ${error.message}`);
                }
            }, 0);

            return messageWithSender;
        }, sequelize);
    }

    /**
     * Récupère les messages non expirés entre deux utilisateurs.
     * @param {string} user1 - ID du premier utilisateur
     * @param {string} user2 - ID du deuxième utilisateur
     * @returns {Promise<Array>} Liste des messages
     */
    async getMessagesBetweenUsers(user1, user2) {
        // Trouver la conversation entre ces deux utilisateurs
        const conversation = await getConversationService().findConversationByParticipants([user1, user2]);

        if (!conversation) {
            return [];
        }

        // Récupérer les messages de cette conversation
        return await this.getConversationMessages(conversation.conversationID);
    }

    /**
     * Récupère les messages d'une conversation spécifique.
     * @param {string} conversationID - ID de la conversation
     * @returns {Promise<Array>} Liste des messages
     */
    async getConversationMessages(conversationID) {
        return await MessagesRepository.getConversationMessages(conversationID);
    }

    /**
     * Récupère les messages non lus pour un utilisateur donné.
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Array>} Liste des messages non lus
     */
    async getUnreadMessages(userID) {
        // Récupérer toutes les conversations de l'utilisateur
        const conversations = await getConversationService().getUserConversations(userID);
        const conversationIDs = conversations.map(c => c.conversationID);

        return await MessagesRepository.getUnreadMessages(conversationIDs);
    }

    /**
     * Marque tous les messages entre un utilisateur et un autre comme lus.
     * @param {string} senderID - ID de l'expéditeur
     * @param {string} receiverID - ID du destinataire
     * @returns {Promise<Array>} Résultat de l'opération
     */
    async markMessagesAsRead(senderID, receiverID) {
        // Trouver la conversation entre ces deux utilisateurs
        const conversation = await getConversationService().findConversationByParticipants([senderID, receiverID]);

        if (!conversation) {
            return [0]; // Aucun message mis à jour
        }

        // Marquer les messages comme lus
        return await this.markConversationAsRead(conversation.conversationID, receiverID);
    }

    /**
     * Marque tous les messages d'une conversation comme lus pour un utilisateur spécifique.
     * @param {string} conversationID - ID de la conversation
     * @param {string} userID - ID de l'utilisateur qui marque les messages comme lus
     * @returns {Promise<Array>} Résultat de l'opération
     */
    async markConversationAsRead(conversationID, userID) {
        try {
            // Vérifier que l'utilisateur fait partie de la conversation
            const conversation = await getConversationService().findConversationById(conversationID);
            if (!conversation || !conversation.participants.includes(userID)) {
                throw createError('L\'utilisateur ne fait pas partie de cette conversation');
            }

            // Marquer les messages comme lus
            const result = await MessagesRepository.markAsRead(conversationID, userID);

            // Notifier les autres participants via WebSocket
            if (result[0] > 0) { // Si des messages ont été mis à jour
                WebSocketService.notifyMessagesRead(conversationID, userID);
                logger.info(`${result[0]} messages marqués comme lus par ${userID} dans la conversation ${conversationID}`);
            }

            return result;
        } catch (error) {
            logger.error(`Erreur lors du marquage des messages comme lus: ${error.message}`);
            throw error;
        }
    }

    /**
     * Supprime les messages expirés et retourne les messages supprimés.
     * @returns {Promise<Array>} Messages supprimés
     */
    async deleteExpiredMessages() {
        try {
            // Récupérer les messages expirés avant de les supprimer
            const expiredMessages = await MessagesRepository.getExpiredMessages();

            if (expiredMessages.length > 0) {
                // Supprimer les messages expirés
                await MessagesRepository.deleteExpiredMessages();
                logger.info(`${expiredMessages.length} messages expirés supprimés`);
                return expiredMessages;
            }

            return [];
        } catch (error) {
            logger.error(`Erreur lors de la suppression des messages expirés: ${error.message}`);
            return [];
        }
    }
}

module.exports = new MessagesService();