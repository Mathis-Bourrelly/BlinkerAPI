const express = require("express");
const AuthMiddleware = require("../../src/core/middlewares/authMiddleware");
const FollowsService = require("../services/follows.service");

const router = express.Router();

/**
 * @swagger
 * /follows/{targetUserID}:
 *   post:
 *     summary: Suivre un utilisateur
 *     description: Permet à un utilisateur authentifié de suivre un autre utilisateur.
 *     tags: [Follow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à suivre
 *     responses:
 *       200:
 *         description: L'utilisateur est maintenant suivi
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post("/:targetUserID", AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const result = await FollowsService.followUser(req.user.userID, req.params.targetUserID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /unfollow/{targetUserID}:
 *   delete:
 *     summary: Se désabonner d'un utilisateur
 *     description: Permet à un utilisateur authentifié d'arrêter de suivre un autre utilisateur.
 *     tags: [Follow]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à ne plus suivre
 *     responses:
 *       200:
 *         description: L'utilisateur a été désabonné avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete("/:targetUserID", AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const result = await FollowsService.unfollowUser(req.user.userID, req.params.targetUserID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /follows/followers/{userID}:
 *   get:
 *     summary: Obtenir la liste des abonnés d'un utilisateur
 *     description: Renvoie la liste des utilisateurs qui suivent un utilisateur donné.
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur cible
 *     responses:
 *       200:
 *         description: Liste des abonnés retournée avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get("/followers/:userID", async (req, res) => {
    try {
        const result = await FollowsService.getFollowers(req.params.userID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /follows/following/{userID}:
 *   get:
 *     summary: Obtenir la liste des utilisateurs suivis par un utilisateur
 *     description: Renvoie la liste des utilisateurs suivis par un utilisateur donné.
 *     tags: [Follow]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur cible
 *     responses:
 *       200:
 *         description: Liste des utilisateurs suivis retournée avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get("/following/:userID", async (req, res) => {
    try {
        const result = await FollowsService.getFollowedUsers(req.params.userID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};