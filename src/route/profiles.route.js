const express = require("express");
const ProfilesService = require("../services/profiles.service");

const router = express.Router();

router.post("/", async (req, res, next) => {
    try {
        const profile = await ProfilesService.createProfile(req.body);
        res.status(201).json(profile);
    } catch (error) {
        next(error);
    }
});

router.get("/:userID", async (req, res, next) => {
    try {
        const profile = await ProfilesService.getProfileByUserID(req.params.userID);
        res.status(200).json(profile);
    } catch (error) {
        next(error);
    }
});

module.exports = {
    initializeRoutes: () => router,
};
