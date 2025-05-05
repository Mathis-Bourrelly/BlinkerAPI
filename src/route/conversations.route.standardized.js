const express = require('express');
const router = express.Router();
const ConversationService = require('../services/conversations.service.js');
const AuthMiddleware = require("../core/middlewares/authMiddleware");
const { body, param } = require('express-validator');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

/**
 * @route GET /conversations
 * @desc Récupère toutes les conversations de l'utilisateur connecté
 * @access Private
 */
router.get('/', 
    AuthMiddleware.verifyToken,
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        logger.info(`Récupération des conversations pour l'utilisateur ${userID}`);
        return await ConversationService.getUserConversations(userID);
    })
);

/**
 * @route GET /conversations/:conversationID
 * @desc Récupère une conversation spécifique
 * @access Private
 */
router.get('/:conversationID', 
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
        
        return conversation;
    })
);

/**
 * @route POST /conversations
 * @desc Crée une nouvelle conversation
 * @access Private
 */
router.post('/', 
    AuthMiddleware.verifyToken,
    validate([
        body('participants').isArray().withMessage('Les participants doivent être un tableau'),
        body('participants.*').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID participant invalide');
            }
            return true;
        }),
        body('participants').custom(value => {
            if (value.length < 2) {
                throw new Error('Une conversation doit avoir au moins 2 participants');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        let { participants } = req.body;
        
        // S'assurer que l'utilisateur actuel est inclus dans les participants
        if (!participants.includes(userID)) {
            participants.push(userID);
        }
        
        logger.info(`Création d'une nouvelle conversation avec participants: ${participants.join(', ')}`);
        
        const conversation = await ConversationService.createConversation(participants);
        return { conversation, status: 201 };
    })
);

/**
 * @route DELETE /conversations/:conversationID
 * @desc Supprime une conversation
 * @access Private
 */
router.delete('/:conversationID', 
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
        
        await ConversationService.deleteConversation(conversationID);
        return { message: 'Conversation supprimée avec succès' };
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
