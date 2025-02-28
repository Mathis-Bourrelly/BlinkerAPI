const express = require("express");
const InteractionsService = require("../services/interactions.service");

const router = express.Router();

router.post("/like/:postID", async (req, res, next) => {
    try {
        const userID = req.user.id; // On récupère l'ID de l'utilisateur depuis le middleware d'auth
        const postID = req.params.postID;
        const result = await InteractionsService.toggleLike(postID, userID);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.post("/dislike/:postID", async (req, res, next) => {
    try {
        const userID = req.user.id;
        const postID = req.params.postID;
        const result = await InteractionsService.toggleDislike(postID, userID);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = {
    initializeRoutes: () => router,
};