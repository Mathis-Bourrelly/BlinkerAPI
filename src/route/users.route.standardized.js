const express = require('express');
const jwt = require('jsonwebtoken');
const { body, param } = require('express-validator');
const UsersService = require('../services/users.service');
const { sendEmail } = require('../core/emailService');
const AuthMiddleware = require('../core/middlewares/authMiddleware');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { normalizePaginationParams } = require('../utils/pagination.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

const router = express.Router();

/**
 * @route POST /users/register
 * @desc Enregistre un nouvel utilisateur
 * @access Public
 */
router.post('/register',
    validate([
        body('email').isEmail().withMessage('Email invalide'),
        body('username').notEmpty().withMessage('Nom d\'utilisateur requis'),
        body('password').isStrongPassword({
            minLength: 12,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }).withMessage('Mot de passe trop faible')
    ]),
    withStandardResponse(async (req) => {
        const user = await UsersService.createUser(
            req.body.username,
            req.body.display_name,
            req.body.bio,
            req.body.email,
            req.body.password,
            undefined,
            false
        );

        logger.info(`Nouvel utilisateur enregistré: ${req.body.email}`);

        return {
            user,
            message: 'Utilisateur créé avec succès, email de confirmation envoyé'
        };
    })
);

/**
 * @route GET /users
 * @desc Récupère tous les utilisateurs
 * @access Public
 */
router.get('/',
    withStandardResponse(async () => {
        return await UsersService.getAllUsers();
    })
);

/**
 * @route GET /users/search
 * @desc Recherche des utilisateurs
 * @access Private
 */
router.get('/search',
    AuthMiddleware.verifyToken,
    withStandardResponse(async (req) => {
        const { query } = req.query;

        if (!query) {
            throw {
                status: 400,
                message: 'Validation failed',
                errors: [{ message: 'Le paramètre "query" est requis' }]
            };
        }

        const { page, limit } = normalizePaginationParams(req.query);

        return await UsersService.searchUsers(query, page, limit);
    })
);

/**
 * @route GET /users/:id
 * @desc Récupère un utilisateur par son ID
 * @access Public
 */
router.get('/:id',
    validate([
        param('id').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        return await UsersService.getUserById(req.params.id);
    })
);

/**
 * @route GET /users/email/:email
 * @desc Récupère un utilisateur par son email
 * @access Public
 */
router.get('/email/:email',
    validate([
        param('email').isEmail().withMessage('Email invalide')
    ]),
    withStandardResponse(async (req) => {
        return await UsersService.getUserByEmail(req.params.email);
    })
);

/**
 * @route PUT /users/:id
 * @desc Met à jour un utilisateur
 * @access Private
 */
router.put('/:id',
    AuthMiddleware.verifyToken,
    validate([
        param('id').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        }),
        body('email').optional().isEmail().withMessage('Email invalide'),
        body('password').optional().isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères')
    ]),
    withStandardResponse(async (req) => {
        await UsersService.updateUser(req.params.id, req.body);
        return { message: 'Utilisateur mis à jour avec succès' };
    })
);

/**
 * @route GET /users/confirm/:token
 * @desc Confirme un compte utilisateur
 * @access Public
 */
router.get('/confirm/:token',
    validate([
        param('token').notEmpty().withMessage('Token requis')
    ]),
    withStandardResponse(async (req) => {
        return await UsersService.confirmUser(req.params.token);
    })
);

/**
 * @route DELETE /users/:id
 * @desc Supprime un utilisateur
 * @access Private
 */
router.delete('/:id',
    AuthMiddleware.verifyToken,
    validate([
        param('id').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        await UsersService.deleteUser(req.params.id);
        return { message: 'Utilisateur supprimé avec succès' };
    })
);

/**
 * @route POST /users/send-test-email
 * @desc Envoie un email de test
 * @access Public
 */
router.post('/send-test-email/',
    validate([
        body('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req, res) => {
        const userID = req.body.userID;
        const user = await UsersService.getUserById(userID);

        // Génération du token de confirmation
        const token = jwt.sign({ userID: userID }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Construire le lien de confirmation
        const confirmationLink = `${req.protocol}://${req.get('host')}/users/confirm/${token}`;

        // Construire le contenu de l'email
        const htmlContent = `
            <h1>Confirmation de compte</h1>
            <p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
            <a href="${confirmationLink}">Vérifier mon compte</a>
        `;

        const subject = req.body.subject || 'Confirmation de votre compte';
        const text = req.body.text || `Cliquez sur le lien suivant pour confirmer votre compte : ${confirmationLink}`;
        const to = user.email;

        await sendEmail(to, subject, text, htmlContent);

        logger.info(`Email de test envoyé à ${to}`);

        return { message: 'E-mail de confirmation envoyé avec succès !' };
    })
);

/**
 * @route POST /users/grant-admin/:userID
 * @desc Accorde les droits d'administrateur à un utilisateur
 * @access Private (Admin)
 */
router.post('/grant-admin/:userID',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkVerifiedUser,
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        return await UsersService.grantUser(req, req.params.userID);
    })
);

/**
 * @route POST /users/reset-password
 * @desc Demande de réinitialisation de mot de passe
 * @access Public
 */
router.post('/reset-password',
    validate([
        body('email').isEmail().withMessage('Email invalide')
    ]),
    withStandardResponse(async (req) => {
        await UsersService.requestPasswordReset(req.body.email);
        return { message: 'Email de réinitialisation envoyé' };
    })
);

/**
 * @route POST /users/reset-password/:token
 * @desc Réinitialise le mot de passe
 * @access Public
 */
router.post('/reset-password/:token',
    validate([
        param('token').notEmpty().withMessage('Token requis'),
        body('newPassword').isStrongPassword({
            minLength: 12,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        }).withMessage('Mot de passe trop faible')
    ]),
    withStandardResponse(async (req) => {
        await UsersService.resetPassword(req.params.token, req.body.newPassword);
        return { message: 'Mot de passe mis à jour avec succès' };
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
