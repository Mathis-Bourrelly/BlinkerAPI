const express = require("express");
const InteractionsService = require("../services/interactions.service");
const AuthMiddleware = require("../core/middlewares/authMiddleware");
const { param } = require('express-validator');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

const router = express.Router();

/**
 * @route POST /interactions/like/:postID
 * @desc Ajoute ou supprime un like sur un post
 * @access Private
 */
router.post("/like/:postID", 
    AuthMiddleware.verifyToken,
    validate([
        param('postID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de post invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const postID = req.params.postID;
        
        logger.info(`Like demandé par ${userID} sur le post ${postID}`);
        
        const result = await InteractionsService.toggleLike(postID, userID);
        
        // Déterminer le message approprié en fonction du résultat
        let message = '';
        if (result.removed) {
            message = 'Like supprimé avec succès';
        } else if (result.updated) {
            message = 'Réaction mise à jour de dislike à like';
        } else {
            message = 'Post liké avec succès';
        }
        
        return { ...result, message };
    })
);

/**
 * @route POST /interactions/dislike/:postID
 * @desc Ajoute ou supprime un dislike sur un post
 * @access Private
 */
router.post("/dislike/:postID", 
    AuthMiddleware.verifyToken,
    validate([
        param('postID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de post invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const postID = req.params.postID;
        
        logger.info(`Dislike demandé par ${userID} sur le post ${postID}`);
        
        const result = await InteractionsService.toggleDislike(postID, userID);
        
        // Déterminer le message approprié en fonction du résultat
        let message = '';
        if (result.removed) {
            message = 'Dislike supprimé avec succès';
        } else if (result.updated) {
            message = 'Réaction mise à jour de like à dislike';
        } else {
            message = 'Post disliké avec succès';
        }
        
        return { ...result, message };
    })
);

/**
 * @route GET /interactions/:postID
 * @desc Récupère les interactions d'un post
 * @access Private
 */
router.get("/:postID", 
    AuthMiddleware.verifyToken,
    validate([
        param('postID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de post invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const postID = req.params.postID;
        const userID = req.user.userID;
        
        logger.info(`Récupération des interactions pour le post ${postID}`);
        
        const interactions = await InteractionsService.getPostInteractions(postID, userID);
        return interactions;
    })
);

/**
 * @route GET /interactions/user/:userID
 * @desc Récupère les interactions d'un utilisateur
 * @access Private
 */
router.get("/user/:userID", 
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
        const targetUserID = req.params.userID;
        const currentUserID = req.user.userID;
        
        // Vérifier que l'utilisateur consulte ses propres interactions ou est admin
        if (currentUserID !== targetUserID && req.user.role !== 'admin') {
            const error = new Error('Vous n\'êtes pas autorisé à consulter ces interactions');
            error.status = 403;
            throw error;
        }
        
        logger.info(`Récupération des interactions pour l'utilisateur ${targetUserID}`);
        
        const interactions = await InteractionsService.getUserInteractions(targetUserID);
        return interactions;
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
