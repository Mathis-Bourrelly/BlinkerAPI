const express = require('express');
const { body, param, query } = require('express-validator');
const AuthMiddleware = require('../core/middlewares/authMiddleware');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { withStandardResponse } = require('../utils/response.utils');
const { normalizePaginationParams } = require('../utils/pagination.utils');
const CommentsService = require('../services/comments.service');
const { logger } = require('../utils/logger.utils');

const router = express.Router();
const commentsService = new CommentsService();

/**
 * @route GET /comments/:blinkID
 * @desc Récupère les commentaires d'un blink avec pagination
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
        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);
        
        logger.info(`Récupération des commentaires pour le blink ${blinkID}`);
        
        const comments = await commentsService.getCommentsByBlinkId(blinkID, page, limit);
        return comments;
    })
);

/**
 * @route POST /comments
 * @desc Crée un nouveau commentaire
 * @access Private
 */
router.post('/',
    AuthMiddleware.verifyToken,
    validate([
        body('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        }),
        body('content')
            .notEmpty()
            .withMessage('Le contenu du commentaire est requis')
            .isLength({ min: 1, max: 1000 })
            .withMessage('Le commentaire doit contenir entre 1 et 1000 caractères')
            .trim()
    ]),
    withStandardResponse(async (req) => {
        const { blinkID, content } = req.body;
        const userID = req.user.userID;
        
        logger.info(`Création d'un commentaire par l'utilisateur ${userID} sur le blink ${blinkID}`);
        
        const comment = await commentsService.createComment(blinkID, userID, content);
        return { comment, message: 'Commentaire créé avec succès', status: 201 };
    })
);

/**
 * @route GET /comments/comment/:commentID
 * @desc Récupère un commentaire spécifique
 * @access Private
 */
router.get('/comment/:commentID',
    AuthMiddleware.verifyToken,
    validate([
        param('commentID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de commentaire invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { commentID } = req.params;
        
        logger.info(`Récupération du commentaire ${commentID}`);
        
        const comment = await commentsService.getCommentById(commentID);
        return { comment };
    })
);

/**
 * @route PUT /comments/:commentID
 * @desc Met à jour un commentaire
 * @access Private
 */
router.put('/:commentID',
    AuthMiddleware.verifyToken,
    validate([
        param('commentID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de commentaire invalide');
            }
            return true;
        }),
        body('content')
            .notEmpty()
            .withMessage('Le contenu du commentaire est requis')
            .isLength({ min: 1, max: 1000 })
            .withMessage('Le commentaire doit contenir entre 1 et 1000 caractères')
            .trim()
    ]),
    withStandardResponse(async (req) => {
        const { commentID } = req.params;
        const { content } = req.body;
        const userID = req.user.userID;
        
        logger.info(`Mise à jour du commentaire ${commentID} par l'utilisateur ${userID}`);
        
        const comment = await commentsService.updateComment(commentID, userID, content);
        return { comment, message: 'Commentaire mis à jour avec succès' };
    })
);

/**
 * @route DELETE /comments/:commentID
 * @desc Supprime un commentaire
 * @access Private
 */
router.delete('/:commentID',
    AuthMiddleware.verifyToken,
    validate([
        param('commentID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de commentaire invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { commentID } = req.params;
        const userID = req.user.userID;
        
        logger.info(`Suppression du commentaire ${commentID} par l'utilisateur ${userID}`);
        
        await commentsService.deleteComment(commentID, userID);
        return { message: 'Commentaire supprimé avec succès' };
    })
);

/**
 * @route GET /comments/user/:userID
 * @desc Récupère les commentaires d'un utilisateur
 * @access Private
 */
router.get('/user/:userID',
    AuthMiddleware.verifyToken,
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { userID } = req.params;
        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);
        
        logger.info(`Récupération des commentaires de l'utilisateur ${userID}`);
        
        const comments = await commentsService.getCommentsByUserId(userID, page, limit);
        return comments;
    })
);

/**
 * @route GET /comments/user/:userID/blink/:blinkID
 * @desc Récupère le commentaire d'un utilisateur pour un blink spécifique
 * @access Private
 */
router.get('/user/:userID/blink/:blinkID',
    AuthMiddleware.verifyToken,
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        }),
        param('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de blink invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { userID, blinkID } = req.params;
        
        logger.info(`Récupération du commentaire de l'utilisateur ${userID} pour le blink ${blinkID}`);
        
        const comment = await commentsService.getUserCommentForBlink(blinkID, userID);
        return { comment };
    })
);

module.exports = router;
