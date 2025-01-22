const express = require("express");
const { validationResult, body } = require("express-validator");
const UsersService = require("../services/users.service");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Vérifie le statut du service
 *     description: Renvoie un objet JSON indiquant que le service est prêt.
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
router.get('/status',
    async (req, res) => {
    res.send({"status":'ready'});
})

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authentifie un utilisateur
 *     description: Connecte un utilisateur avec un email et un mot de passe et renvoie un jeton JWT.
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
 *       401:
 *         description: Adresse e-mail ou mot de passe incorrect.
 *       403:
 *         description: Le compte n'est pas confirmé.
 *       500:
 *         description: Erreur interne.
 */
router.post('/login',
    body('email').not().isEmpty(),
    body('password').not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;

            // Récupérer l'utilisateur par e-mail
            const user = await UsersService.getUserByEmail(email);

            if (!user) {
                return res.status(401).json({ message: "Adresse e-mail ou mot de passe incorrect." });
            }

            // Vérifier si le compte est confirmé
            if (!user.isVerified) {
                return res.status(403).json({ message: "Votre compte n'est pas encore confirmé." });
            }

            // Vérifier le mot de passe
            const isPasswordValid = bcrypt.compareSync(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Adresse e-mail ou mot de passe incorrect." });
            }

            // Générer un jeton JWT
            const token = jwt.sign(
                { userID: user.userID, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "1d" } // Jeton valide 1 jour
            );

            res.status(200).json({ token, message: "Connexion réussie !" });
        } catch (error) {
            console.error("Erreur lors de la connexion :", error.message);
            res.status(500).json({ message: `Erreur lors de la connexion : ${error.message}` });
        }
    }
);

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Vérifie un jeton JWT
 *     description: Vérifie si un jeton JWT est valide et renvoie les données décodées.
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
    body("token").not().isEmpty().withMessage("Le jeton est requis."),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { token } = req.body;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            res.status(200).json({ message: "Jeton valide.", decoded });
        } catch (error) {
            console.error("Erreur lors de la vérification du jeton :", error.message);
            res.status(401).json({ message: "Jeton invalide ou expiré." });
        }
    }
);

module.exports = {
    initializeRoutes: () => router,
};