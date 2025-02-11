const express = require("express");
const { validationResult, body } = require("express-validator");
const AuthService = require("../services/login.service");
const router = express.Router();

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Vérifie le statut du service
 *     description: Renvoie un objet JSON indiquant que le service est prêt.
 *     tags: [login]
 *     responses:
 *       200:
 *         description: Le service est prêt.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 */
router.get('/status', (req, res) => {
    res.json({ status: "ready" });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authentifie un utilisateur
 *     description: Connecte un utilisateur avec un email et un mot de passe et renvoie un jeton JWT.
 *     tags: [login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "example@example.com"
 *               password:
 *                 type: string
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *                   example: "Connexion réussie !"
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Adresse e-mail ou mot de passe incorrect.
 *       403:
 *         description: Le compte n'est pas confirmé.
 *       500:
 *         description: Erreur interne.
 */
router.post('/login',
    body('email').notEmpty().withMessage("L'email est requis"),
    body('password').notEmpty().withMessage("Le mot de passe est requis"),
    async (req, res) => {
        try {
            const result = await AuthService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            res.status(error.status || 500).json({ message: error.message });
        }
    }
);

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Vérifie un jeton JWT
 *     description: Vérifie si un jeton JWT est valide et renvoie les données décodées.
 *     tags: [login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "your.jwt.token"
 *     responses:
 *       200:
 *         description: Jeton valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Jeton valide."
 *                 decoded:
 *                   type: object
 *       401:
 *         description: Jeton invalide ou expiré.
 */
router.post(
    "/auth",
    body("token").notEmpty().withMessage("Le jeton est requis."),
    async (req, res) => {
        try {
            const result = await AuthService.verifyToken(req.body.token);
            res.status(200).json(result);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
);

module.exports = {
    initializeRoutes: () => router,
};