const express = require('express');
const router = express.Router();
// Import services directly to avoid circular dependencies
const MessagesService = require('../services/messages.service.js');
const ConversationService = require('../services/conversations.service.js');
const AuthMiddleware = require("../core/middlewares/authMiddleware");
const { body, param } = require('express-validator');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

/**
 * @route POST /messages
 * @desc Envoie un nouveau message
 * @access Private
 * @deprecated Utilisez les WebSockets avec l'événement 'sendMessage' à la place
 */
// Route supprimée car remplacée par WebSocket

/**
 * @route GET /messages/between/:userID
 * @desc Récupère les messages entre l'utilisateur connecté et un autre utilisateur
 * @access Private
 */
router.get('/between/:userID',
    AuthMiddleware.verifyToken,
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const currentUserID = req.user.userID;
        const otherUserID = req.params.userID;

        const messages = await MessagesService.getMessagesBetweenUsers(currentUserID, otherUserID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        return messages.map(message => message.get({ plain: true }));
    })
);

/**
 * @route GET /messages/conversation/:conversationID
 * @desc Récupère les messages d'une conversation spécifique
 * @access Private
 * @deprecated Utilisez les WebSockets avec l'événement 'getConversationMessages' à la place
 */
// Route supprimée car remplacée par WebSocket

/**
 * @route POST /messages/conversation
 * @desc Récupère les messages d'une conversation spécifique (alternative à la route GET)
 * @access Private
 * @deprecated Utilisez les WebSockets avec l'événement 'getConversationMessages' à la place
 */
// Route supprimée car remplacée par WebSocket

/**
 * @route GET /messages/unread
 * @desc Récupère les messages non lus de l'utilisateur connecté
 * @access Private
 */
router.get('/unread',
    AuthMiddleware.verifyToken,
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const messages = await MessagesService.getUnreadMessages(userID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        return messages.map(message => message.get({ plain: true }));
    })
);

/**
 * @route PUT /messages/read/:senderID
 * @desc Marque tous les messages d'un expéditeur comme lus
 * @access Private
 */
router.put('/read/:senderID',
    AuthMiddleware.verifyToken,
    validate([
        param('senderID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID expéditeur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const receiverID = req.user.userID;
        const senderID = req.params.senderID;

        await MessagesService.markMessagesAsRead(senderID, receiverID);
        return { message: 'Messages marqués comme lus' };
    })
);

/**
 * @route PUT /messages/read/conversation/:conversationID
 * @desc Marque tous les messages d'une conversation comme lus
 * @access Private
 * @deprecated Utilisez les WebSockets avec l'événement 'markAsRead' à la place
 */
// Route supprimée car remplacée par WebSocket

/**
 * @route DELETE /messages/expired
 * @desc Supprime les messages expirés (tâche d'administration)
 * @access Private (Admin)
 */
router.delete('/expired',
    AuthMiddleware.verifyToken,
    withStandardResponse(async (req) => {
        // Vérifier si l'utilisateur est un administrateur
        if (req.user.role !== 'admin') {
            const error = new Error('Accès non autorisé');
            error.status = 403;
            throw error;
        }

        await MessagesService.deleteExpiredMessages();
        return { message: 'Messages expirés supprimés avec succès' };
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
