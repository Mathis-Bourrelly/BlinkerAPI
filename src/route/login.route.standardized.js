const express = require("express");
const { body } = require("express-validator");
const AuthMiddleware = require("../core/middlewares/AuthMiddleware");
const LoginService = require("../services/Login.service");
const { validate } = require('../utils/validation.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

const router = express.Router();

/**
 * @route GET /status
 * @desc Vérifie le statut de l'API
 * @access Public
 */
router.get("/status", 
    withStandardResponse(async () => {
        return { status: "ready" };
    })
);

/**
 * @route POST /login
 * @desc Authentifie un utilisateur avec email et mot de passe
 * @access Public
 */
router.post("/login",
    validate([
        body("email").notEmpty().withMessage("L'email est requis"),
        body("password").notEmpty().withMessage("Le mot de passe est requis")
    ]),
    withStandardResponse(async (req) => {
        logger.info(`Tentative de connexion pour l'email: ${req.body.email}`);
        const result = await LoginService.login(req.body);
        return result;
    })
);

/**
 * @route POST /checkToken
 * @desc Vérifie la validité d'un token JWT
 * @access Private
 */
router.post("/checkToken",
    AuthMiddleware.verifyToken,
    withStandardResponse(async () => {
        return { valid: true };
    })
);

/**
 * @route POST /login/google
 * @desc Authentifie un utilisateur avec Google
 * @access Public
 */
router.post("/login/google",
    validate([
        body("id_token").notEmpty().withMessage("Le token Google est requis.")
    ]),
    withStandardResponse(async (req) => {
        logger.info("Tentative de connexion avec Google");
        const result = await LoginService.loginWithGoogle(req.body.id_token);
        return result;
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
