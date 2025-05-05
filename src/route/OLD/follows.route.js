const express = require("express");
const AuthMiddleware = require("../../core/middlewares/authMiddleware");
const FollowsService = require("../../services/follows.service");

const router = express.Router();

router.post("/:targetUserID", AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const result = await FollowsService.followUser(req.user.userID, req.params.targetUserID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

router.delete("/:targetUserID", AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const result = await FollowsService.unfollowUser(req.user.userID, req.params.targetUserID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});


router.get("/followers/:userID", async (req, res) => {
    try {
        const result = await FollowsService.getFollowers(req.params.userID);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

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