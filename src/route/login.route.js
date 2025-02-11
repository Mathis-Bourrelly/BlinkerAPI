const express = require("express");
const { validationResult, body } = require("express-validator");
const AuthService = require("../services/login.service");

const router = express.Router();

/**
 * Vérifie le statut du service.
 */
router.get("/status", (req, res) => {
    res.json({ status: "ready" });
});

/**
 * Authentification utilisateur via email/mot de passe.
 */
router.post(
    "/login",
    [
        body("email").notEmpty().withMessage("L'email est requis"),
        body("password").notEmpty().withMessage("Le mot de passe est requis"),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const result = await AuthService.login(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Vérification d'un token JWT.
 */
router.post(
    "/auth",
    body("token").notEmpty().withMessage("Le jeton est requis."),
    async (req, res, next) => {
        try {
            const result = await AuthService.verifyToken(req.body.token);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Authentification avec Google OAuth.
 */
router.post(
    "/auth/google",
    body("token").notEmpty().withMessage("Le token Google est requis."),
    async (req, res, next) => {
        try {
            const result = await AuthService.loginWithGoogle(req.body.token);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = {
    initializeRoutes: () => router,
};