const express = require("express");
const ProfilesService = require("../services/profiles.service");
const multer = require("multer");
const AuthMiddleware = require("../core/middlewares/authMiddleware");

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 },  })

router.post("/", AuthMiddleware.verifyToken, upload.single('avatar'), async (req, res, next) => {
    try {
        const profile = await ProfilesService.createProfile(req.body.name,req.body.username,req.body.display_name,req.body.bio,req.file);
        res.status(201).json(profile);
    } catch (error) {
        next(error);
    }
});

router.get("/:userID", AuthMiddleware.verifyToken, async (req, res, next) => {
    try {
        const profile = await ProfilesService.getProfileByUserID(req.params.userID, req.user.userID);
        res.status(200).json(profile);
    } catch (error) {
        next(error);
    }
});

router.post('/upload-avatar/:userID', AuthMiddleware.verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        const userID = req.params.userID;
        const file = req.file; // Objet file contenant les informations sur le fichier uploadé

        // Utiliser le service pour mettre à jour l'avatar
        const avatarUrl = await ProfilesService.updateAvatar(userID, file);

        res.status(200).send({ message: 'Avatar uploaded successfully', avatarUrl });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message || 'Error uploading avatar' });
    }
});


module.exports = {
    initializeRoutes: () => router,
};
