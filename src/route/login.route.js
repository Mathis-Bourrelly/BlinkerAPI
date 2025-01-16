const express = require("express");
const { validationResult, body } = require("express-validator");
const UsersService = require("../services/users.service");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

  
router.get('/status',
    async (req, res) => {
    res.send({"status":'ready'});
})


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

// Vérification d'un jeton JWT
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