const express = require("express");
const ProfilesService = require("../services/profiles.service");

const router = express.Router();

/**
 * @swagger
 * /profiles:
 *   post:
 *     summary: Crée un profil pour un utilisateur
 *     description: Associe un profil à un utilisateur existant avec un username, une bio et une photo.
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userID:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               username:
 *                 type: string
 *                 example: "user123"
 *               bio:
 *                 type: string
 *                 example: "Développeur full-stack passionné."
 *               avatar_url:
 *                 type: string
 *                 example: "https://example.com/avatar.png"
 *     responses:
 *       201:
 *         description: Profil créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userID:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 username:
 *                   type: string
 *                   example: "user123"
 *                 bio:
 *                   type: string
 *                   example: "Développeur full-stack passionné."
 *                 avatar_url:
 *                   type: string
 *                   example: "https://example.com/avatar.png"
 *                 score:
 *                   type: integer
 *                   example: 0
 *       400:
 *         description: Erreur de validation.
 *       409:
 *         description: Username déjà utilisé.
 *       500:
 *         description: Erreur interne.
 */
router.post("/", async (req, res, next) => {
    try {
        const profile = await ProfilesService.createProfile(req.body);
        res.status(201).json(profile);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /profiles/{userID}:
 *   get:
 *     summary: Récupère le profil d'un utilisateur
 *     description: Retourne le profil d'un utilisateur à partir de son userID.
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userID:
 *                   type: string
 *                   format: uuid
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 username:
 *                   type: string
 *                   example: "user123"
 *                 bio:
 *                   type: string
 *                   example: "Développeur full-stack passionné."
 *                 avatar_url:
 *                   type: string
 *                   example: "https://example.com/avatar.png"
 *                 score:
 *                   type: integer
 *                   example: 0
 *       404:
 *         description: Profil non trouvé.
 *       500:
 *         description: Erreur interne.
 */
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
