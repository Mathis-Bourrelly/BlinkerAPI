const express = require('express');
const router = express.Router();
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
 */
router.post('/', 
    AuthMiddleware.verifyToken,
    validate([
        body('content').notEmpty().withMessage('Le contenu du message est requis'),
        body('receiverID').optional().custom(value => {
            if (value && !isValidUUID(value)) {
                throw new Error('ID de destinataire invalide');
            }
            return true;
        }),
        body('conversationID').optional().custom(value => {
            if (value && !isValidUUID(value)) {
                throw new Error('ID de conversation invalide');
            }
            return true;
        }),
        body().custom(value => {
            if (!value.receiverID && !value.conversationID) {
                throw new Error('receiverID ou conversationID est requis');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { receiverID, content, conversationID } = req.body;
        const userID = req.user.userID;

        logger.info(`Envoi d'un message de ${userID} à ${receiverID || 'conversation ' + conversationID}`);
        
        const message = await MessagesService.sendMessage(userID, receiverID, content, conversationID);
        return { message, status: 201 };
    })
);

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
 */
router.get('/conversation/:conversationID', 
    AuthMiddleware.verifyToken,
    validate([
        param('conversationID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID conversation invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const conversationID = req.params.conversationID;

        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await ConversationService.findConversationById(conversationID);
        if (!conversation) {
            const error = new Error('Conversation non trouvée');
            error.status = 404;
            throw error;
        }
        
        if (!conversation.participants.includes(userID)) {
            const error = new Error('Accès non autorisé à cette conversation');
            error.status = 403;
            throw error;
        }

        const messages = await MessagesService.getConversationMessages(conversationID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        return messages.map(message => message.get({ plain: true }));
    })
);

/**
 * @route POST /messages/conversation
 * @desc Récupère les messages d'une conversation spécifique (alternative à la route GET)
 * @access Private
 */
router.post('/conversation', 
    AuthMiddleware.verifyToken,
    validate([
        body('conversationID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID conversation invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const { conversationID } = req.body;

        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await ConversationService.findConversationById(conversationID);
        if (!conversation) {
            const error = new Error('Conversation non trouvée');
            error.status = 404;
            throw error;
        }
        
        if (!conversation.participants.includes(userID)) {
            const error = new Error('Accès non autorisé à cette conversation');
            error.status = 403;
            throw error;
        }

        const messages = await MessagesService.getConversationMessages(conversationID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        return messages.map(message => message.get({ plain: true }));
    })
);

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
 */
router.put('/read/conversation/:conversationID', 
    AuthMiddleware.verifyToken,
    validate([
        param('conversationID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID conversation invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const conversationID = req.params.conversationID;

        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await ConversationService.findConversationById(conversationID);
        if (!conversation) {
            const error = new Error('Conversation non trouvée');
            error.status = 404;
            throw error;
        }
        
        if (!conversation.participants.includes(userID)) {
            const error = new Error('Accès non autorisé à cette conversation');
            error.status = 403;
            throw error;
        }

        await MessagesService.markConversationMessagesAsRead(conversationID, userID);
        return { message: 'Messages marqués comme lus' };
    })
);

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
