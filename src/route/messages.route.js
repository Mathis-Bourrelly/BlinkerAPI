const express = require('express');
const router = express.Router();
const MessagesService = require('../services/messages.service.js');
const ConversationService = require('../services/conversations.service.js');
const AuthMiddleware = require("../core/middlewares/authMiddleware");

/**
 * @route POST /messages
 * @desc Envoie un nouveau message
 * @access Private
 */
router.post('/', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { receiverID, content, conversationID } = req.body;
        const userID = req.user.userID;

        if (!content) {
            return res.status(400).json({ error: 'Données invalides. Le contenu du message est requis.' });
        }

        if (!receiverID && !conversationID) {
            return res.status(400).json({ error: 'Données invalides. receiverID ou conversationID est requis.' });
        }

        const message = await MessagesService.sendMessage(userID, receiverID, content, conversationID);
        return res.status(201).json(message);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /messages/between/:userID
 * @desc Récupère les messages entre l'utilisateur connecté et un autre utilisateur
 * @access Private
 */
router.get('/between/:userID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const currentUserID = req.user.userID;
        const otherUserID = req.params.userID;

        if (!otherUserID) {
            return res.status(400).json({ error: 'ID utilisateur requis' });
        }

        const messages = await MessagesService.getMessagesBetweenUsers(currentUserID, otherUserID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        const plainMessages = messages.map(message => {
            const plainMessage = message.get({ plain: true });
            return plainMessage;
        });

        return res.status(200).json(plainMessages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /messages/conversation/:conversationID
 * @desc Récupère les messages d'une conversation spécifique
 * @access Private
 */
router.get('/conversation/:conversationID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userID = req.user.userID;
        const conversationID = req.params.conversationID;

        if (!conversationID) {
            return res.status(400).json({ error: 'ID conversation requis' });
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await ConversationService.findConversationById(conversationID);
        if (!conversation || !conversation.participants.includes(userID)) {
            return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
        }

        const messages = await MessagesService.getConversationMessages(conversationID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        const plainMessages = messages.map(message => {
            const plainMessage = message.get({ plain: true });
            return plainMessage;
        });

        return res.status(200).json(plainMessages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /messages/conversation
 * @desc Récupère les messages d'une conversation spécifique (alternative à la route GET)
 * @access Private
 */
router.post('/conversation', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userID = req.user.userID;
        const { conversationID } = req.body;

        if (!conversationID) {
            return res.status(400).json({ error: 'ID conversation requis' });
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await ConversationService.findConversationById(conversationID);
        if (!conversation || !conversation.participants.includes(userID)) {
            return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
        }

        const messages = await MessagesService.getConversationMessages(conversationID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        const plainMessages = messages.map(message => {
            const plainMessage = message.get({ plain: true });
            return plainMessage;
        });

        return res.status(200).json(plainMessages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route GET /messages/unread
 * @desc Récupère les messages non lus de l'utilisateur connecté
 * @access Private
 */
router.get('/unread', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userID = req.user.userID;
        const messages = await MessagesService.getUnreadMessages(userID);

        // Transformer explicitement les objets Sequelize en objets JavaScript simples
        const plainMessages = messages.map(message => {
            const plainMessage = message.get({ plain: true });
            return plainMessage;
        });

        return res.status(200).json(plainMessages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /messages/read/:senderID
 * @desc Marque tous les messages d'un expéditeur comme lus
 * @access Private
 */
router.put('/read/:senderID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const receiverID = req.user.userID;
        const senderID = req.params.senderID;

        if (!senderID) {
            return res.status(400).json({ error: 'ID expéditeur requis' });
        }

        await MessagesService.markMessagesAsRead(senderID, receiverID);
        return res.status(200).json({ message: 'Messages marqués comme lus' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route PUT /messages/read/conversation/:conversationID
 * @desc Marque tous les messages d'une conversation comme lus
 * @access Private
 */
router.put('/read/conversation/:conversationID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userID = req.user.userID;
        const conversationID = req.params.conversationID;

        if (!conversationID) {
            return res.status(400).json({ error: 'ID conversation requis' });
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        const conversation = await ConversationService.findConversationById(conversationID);
        if (!conversation || !conversation.participants.includes(userID)) {
            return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
        }

        await MessagesService.markConversationMessagesAsRead(conversationID, userID);
        return res.status(200).json({ message: 'Messages marqués comme lus' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

/**
 * @route DELETE /messages/expired
 * @desc Supprime les messages expirés (tâche d'administration)
 * @access Private (Admin)
 */
router.delete('/expired', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est un administrateur
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }

        await MessagesService.deleteExpiredMessages();
        return res.status(200).json({ message: 'Messages expirés supprimés avec succès' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
