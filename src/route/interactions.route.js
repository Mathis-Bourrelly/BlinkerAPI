const express = require("express");
const InteractionsService = require("../services/interactions.service");
const AuthMiddleware = require("../../src/core/middlewares/authMiddleware");

const router = express.Router();

router.post("/like/:postID", AuthMiddleware.verifyToken, async (req, res, next) => {
    try {
        console.log("🔍 req.user dans le contrôleur (like):", req.user); // DEBUG

        if (!req.user || !req.user.userID) {
            return res.status(401).json({ error: "Utilisateur non authentifié" });
        }

        const userID = req.user.userID;
        const postID = req.params.postID;
        console.log(`✅ Like demandé par ${userID} sur le post ${postID}`); // DEBUG

        const result = await InteractionsService.toggleLike(postID, userID);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.post("/dislike/:postID", AuthMiddleware.verifyToken, async (req, res, next) => {
    try {
        console.log("🔍 req.user dans le contrôleur (dislike):", req.user); // DEBUG

        if (!req.user || !req.user.userID) {
            return res.status(401).json({ error: "Utilisateur non authentifié" });
        }

        const userID = req.user.userID;
        const postID = req.params.postID;
        console.log(`✅ Dislike demandé par ${userID} sur le post ${postID}`); // DEBUG

        const result = await InteractionsService.toggleDislike(postID, userID);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = {
    initializeRoutes: () => router,
};
