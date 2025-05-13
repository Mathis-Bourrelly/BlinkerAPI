const express = require('express');
const router = express.Router();
const BlinkService = require('../services/blinks.service.js');
const AuthMiddleware = require("../core/middlewares/authMiddleware");
const { body, param } = require('express-validator');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { normalizePaginationParams } = require('../utils/pagination.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');

/**
 * @route GET /blinks/search
 * @desc Recherche des blinks et des utilisateurs
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
                errors: [{ message: "Le paramètre 'query' est requis." }]
            };
        }

        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);

        return await BlinkService.searchBlinksAndUsers(query, page, limit);
    })
);

/**
 * @route GET /blinks
 * @desc Récupère les blinks avec pagination
 * @access Private
 */
router.get("/",
    AuthMiddleware.verifyToken,
    withStandardResponse(async (req) => {
        const { page = 1, limit = 10, userId } = normalizePaginationParams(req.query);
        return await BlinkService.getPaginatedBlinks(page, limit, userId || null, req.user.userID);
    })
);

/**
 * @route GET /blinks/liked
 * @desc Récupère les blinks aimés par l'utilisateur
 * @access Private
 */
router.get("/liked",
    AuthMiddleware.verifyToken,
    withStandardResponse(async (req) => {
        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);
        return await BlinkService.getLikedBlinks(req.user.userID, page, limit);
    })
);

/**
 * @route GET /blinks/byuser/:userID
 * @desc Récupère les blinks d'un utilisateur spécifique
 * @access Private
 */
router.get("/byuser/:userID",
    AuthMiddleware.verifyToken,
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID d\'utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { userID } = req.params;
        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);
        return await BlinkService.getPaginatedBlinks(page, limit, userID, req.user.userID);
    })
);

/**
 * @route POST /blinks
 * @desc Crée un nouveau blink
 * @access Private
 */
router.post('/',
    AuthMiddleware.verifyToken,
    validate([
        body('contents').isArray().withMessage('Le contenu doit être un tableau'),
        body('contents.*.contentType').isIn(['text', 'image', 'video']).withMessage('Type de contenu invalide'),
        body('contents.*.content').notEmpty().withMessage('Le contenu ne peut pas être vide'),
        body('contents.*.position').isInt({ min: 0 }).withMessage('La position doit être un entier positif')
    ]),
    withStandardResponse(async (req) => {
        const { contents } = req.body;
        const userID = req.user.userID;

        const blink = await BlinkService.createBlinkWithContent({ userID, contents });
        return { blink, message: 'Blink créé avec succès' };
    })
);

/**
 * @route DELETE /blinks/expired
 * @desc Supprime les blinks expirés
 * @access Private
 */
router.delete('/expired',
    AuthMiddleware.verifyToken,
    withStandardResponse(async () => {
        await BlinkService.deleteExpiredBlinks();
        return { message: "Blinks expirés supprimés avec succès." };
    })
);

/**
 * @route GET /blinks/:blinkID
 * @desc Récupère un blink par son ID
 * @access Private
 */
router.get('/:blinkID',
    AuthMiddleware.verifyToken,
    validate([
        param('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { blinkID } = req.params;
        const userID = req.user.userID;
        const blink = await BlinkService.getBlinkById(blinkID, userID);

        if (!blink) {
            const error = new Error('Blink non trouvé');
            error.status = 404;
            throw error;
        }

        return blink;
    })
);

/**
 * @route PUT /blinks/:blinkID
 * @desc Met à jour un blink
 * @access Private
 */
router.put('/:blinkID',
    AuthMiddleware.verifyToken,
    validate([
        param('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        }),
        body('contents').isArray().withMessage('Le contenu doit être un tableau'),
        body('contents.*.contentType').isIn(['text', 'image', 'video']).withMessage('Type de contenu invalide'),
        body('contents.*.content').notEmpty().withMessage('Le contenu ne peut pas être vide'),
        body('contents.*.position').isInt({ min: 0 }).withMessage('La position doit être un entier positif')
    ]),
    withStandardResponse(async (req) => {
        const { blinkID } = req.params;
        const { contents } = req.body;

        const updatedBlink = await BlinkService.updateBlink(blinkID, { contents });
        return { blink: updatedBlink, message: 'Blink mis à jour avec succès' };
    })
);

/**
 * @route DELETE /blinks/:blinkID
 * @desc Supprime un blink
 * @access Private
 */
router.delete('/:blinkID',
    AuthMiddleware.verifyToken,
    validate([
        param('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { blinkID } = req.params;
        await BlinkService.deleteBlink(blinkID);
        return { message: 'Blink supprimé avec succès' };
    })
);

/**
 * @route GET /blinks/remaining-time/:blinkID
 * @desc Récupère le temps restant d'un blink
 * @access Private
 */
router.get('/remaining-time/:blinkID',
    AuthMiddleware.verifyToken,
    validate([
        param('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { blinkID } = req.params;
        const remainingTime = await BlinkService.calculateRemainingTime(blinkID);

        return { blinkID, remainingTime };
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
