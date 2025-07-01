/**
 * Service pour faciliter l'utilisation des WebSockets dans l'application
 */
const SocketManager = require('../core/socket');
const { logger } = require('../utils/logger.utils');
const { v4: uuidv4 } = require('uuid');

class WebSocketService {
    /**
     * Envoie un message à un utilisateur spécifique
     * @param {string} userID - ID de l'utilisateur destinataire
     * @param {string} event - Nom de l'événement à émettre
     * @param {Object} data - Données à envoyer
     * @returns {string} L'identifiant unique de l'événement
     */
    sendToUser(userID, event, data) {
        try {
            const eventId = uuidv4();
            const payload = { ...data, eventId };

            const io = SocketManager.getIO();
            io.to(userID).emit(event, payload);
            logger.debug(`WebSocket: Événement ${event} (${eventId}) envoyé à l'utilisateur ${userID}`);
            return eventId;
        } catch (error) {
            logger.error(`Erreur lors de l'envoi d'un événement WebSocket à l'utilisateur ${userID}: ${error.message}`);
            return null;
        }
    }

    /**
     * Envoie un message à tous les participants d'une conversation
     * @param {string} conversationID - ID de la conversation
     * @param {string} event - Nom de l'événement à émettre
     * @param {Object} data - Données à envoyer
     * @returns {string} L'identifiant unique de l'événement
     */
    sendToConversation(conversationID, event, data) {
        try {
            const eventId = uuidv4();
            const payload = { ...data, eventId };

            const io = SocketManager.getIO();
            io.to(`conversation:${conversationID}`).emit(event, payload);
            logger.debug(`WebSocket: Événement ${event} (${eventId}) envoyé à la conversation ${conversationID}`);
            return eventId;
        } catch (error) {
            logger.error(`Erreur lors de l'envoi d'un événement WebSocket à la conversation ${conversationID}: ${error.message}`);
            return null;
        }
    }

    /**
     * Envoie un message à tous les utilisateurs connectés
     * @param {string} event - Nom de l'événement à émettre
     * @param {Object} data - Données à envoyer
     * @returns {string} L'identifiant unique de l'événement
     */
    broadcast(event, data) {
        try {
            const eventId = uuidv4();
            const payload = { ...data, eventId };

            const io = SocketManager.getIO();
            io.emit(event, payload);
            logger.debug(`WebSocket: Événement ${event} (${eventId}) diffusé à tous les utilisateurs`);
            return eventId;
        } catch (error) {
            logger.error(`Erreur lors de la diffusion d'un événement WebSocket: ${error.message}`);
            return null;
        }
    }

    /**
     * Notifie un utilisateur d'un nouveau message
     * @param {string} userID - ID de l'utilisateur à notifier
     * @param {Object} message - Message à notifier
     * @param {string} conversationID - ID de la conversation
     * @returns {string} L'identifiant unique de l'événement
     */
    notifyNewMessage(userID, message, conversationID) {
        return this.sendToUser(userID, 'messageNotification', {
            conversationID,
            message,
            timestamp: Date.now()
        });
    }

    /**
     * Notifie tous les participants d'une conversation que des messages ont été lus
     * @param {string} conversationID - ID de la conversation
     * @param {string} userID - ID de l'utilisateur qui a lu les messages
     * @returns {string} L'identifiant unique de l'événement
     */
    notifyMessagesRead(conversationID, userID) {
        return this.sendToConversation(conversationID, 'messagesRead', {
            conversationID,
            userID,
            timestamp: Date.now()
        });
    }
}

module.exports = new WebSocketService();
