const express = require('express');
const router = express.Router();
const BlinkService = require('../../services/blinks.service.js');
const AuthMiddleware = require("../../core/middlewares/authMiddleware");
const { body } = require('express-validator');
const { validate, isValidUUID } = require('../../utils/validation.utils');
const { normalizePaginationParams } = require('../../utils/pagination.utils');

/**
 * @route GET /blinks/search
 * @desc Recherche des blinks et des utilisateurs
 * @access Private
 */
router.get('/search', 
    AuthMiddleware.verifyToken, 
    validate([
        body('query').notEmpty().withMessage("Le paramètre 'query' est requis.")
    ]),
    async (req, res, next) => {
        try {
            const { query } = req.query;
            const { page = 1, limit = 10 } = normalizePaginationParams(req.query);

            const result = await BlinkService.searchBlinksAndUsers(query, page, limit);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /blinks
 * @desc Récupère les blinks avec pagination
 * @access Private
 */
router.get("/", 
    AuthMiddleware.verifyToken, 
    async (req, res, next) => {
        try {
            const { page = 1, limit = 10, userId } = normalizePaginationParams(req.query);
            const result = await BlinkService.getPaginatedBlinks(page, limit, userId || null, req.user.userID);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /blinks/liked
 * @desc Récupère les blinks aimés par l'utilisateur
 * @access Private
 */
router.get("/liked", 
    AuthMiddleware.verifyToken, 
    async (req, res, next) => {
        try {
            const { page = 1, limit = 10 } = normalizePaginationParams(req.query);
            const result = await BlinkService.getLikedBlinks(req.user.userID, page, limit);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
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
    async (req, res, next) => {
        try {
            const { contents } = req.body;
            const userID = req.user.userID;

            const blink = await BlinkService.createBlinkWithContent({ userID, contents });
            return res.status(201).json(blink);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /blinks/expired
 * @desc Supprime les blinks expirés
 * @access Private
 */
router.delete('/expired', 
    AuthMiddleware.verifyToken, 
    async (req, res, next) => {
        try {
            await BlinkService.deleteExpiredBlinks();
            return res.status(200).json({ message: "Blinks expirés supprimés avec succès." });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /blinks/:blinkID
 * @desc Récupère un blink par son ID
 * @access Private
 */
router.get('/:blinkID', 
    AuthMiddleware.verifyToken,
    validate([
        body('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    async (req, res, next) => {
        try {
            const { blinkID } = req.params;
            const blink = await BlinkService.getBlinkById(blinkID);

            if (!blink) {
                return res.status(404).json({ error: 'Blink non trouvé' });
            }

            return res.status(200).json(blink);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route PUT /blinks/:blinkID
 * @desc Met à jour un blink
 * @access Private
 */
router.put('/:blinkID', 
    AuthMiddleware.verifyToken,
    validate([
        body('blinkID').custom(value => {
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
    async (req, res, next) => {
        try {
            const { blinkID } = req.params;
            const { contents } = req.body;

            const updatedBlink = await BlinkService.updateBlink(blinkID, { contents });
            return res.status(200).json(updatedBlink);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route DELETE /blinks/:blinkID
 * @desc Supprime un blink
 * @access Private
 */
router.delete('/:blinkID', 
    AuthMiddleware.verifyToken,
    validate([
        body('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    async (req, res, next) => {
        try {
            const { blinkID } = req.params;
            await BlinkService.deleteBlink(blinkID);
            return res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @route GET /blinks/remaining-time/:blinkID
 * @desc Récupère le temps restant d'un blink
 * @access Private
 */
router.get('/remaining-time/:blinkID', 
    AuthMiddleware.verifyToken,
    validate([
        body('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    async (req, res, next) => {
        try {
            const { blinkID } = req.params;
            const remainingTime = await BlinkService.calculateRemainingTime(blinkID);

            return res.status(200).json({ blinkID, remainingTime });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = {
    initializeRoutes: () => router,
};
