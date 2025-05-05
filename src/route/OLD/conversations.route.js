const express = require('express');
const router = express.Router();
const ConversationService = require('../../services/conversations.service.js');
const AuthMiddleware = require("../../core/middlewares/authMiddleware");

/**
 * @route GET /conversations
 * @desc Récupère toutes les conversations de l'utilisateur connecté
 * @access Private
 */
router.get('/', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const userID = req.user.userID;
        const conversations = await ConversationService.getUserConversations(userID);
        return res.status(200).json(conversations);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
