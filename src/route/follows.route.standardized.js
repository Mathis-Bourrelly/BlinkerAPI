const express = require("express");
const AuthMiddleware = require("../core/middlewares/authMiddleware");
const FollowsService = require("../services/follows.service");
const { param, query } = require('express-validator');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { normalizePaginationParams } = require('../utils/pagination.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

const router = express.Router();

/**
 * @route POST /follows/:targetUserID
 * @desc Suivre un utilisateur
 * @access Private
 */
router.post("/:targetUserID", 
    AuthMiddleware.verifyToken,
    validate([
        param('targetUserID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur cible invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const fromUserID = req.user.userID;
        const targetUserID = req.params.targetUserID;
        
        // Vérifier que l'utilisateur ne tente pas de se suivre lui-même
        if (fromUserID === targetUserID) {
            const error = new Error('Vous ne pouvez pas vous suivre vous-même');
            error.status = 400;
            throw error;
        }
        
        logger.info(`Utilisateur ${fromUserID} suit ${targetUserID}`);
        
        const result = await FollowsService.followUser(fromUserID, targetUserID);
        return { 
            ...result, 
            message: 'Utilisateur suivi avec succès' 
        };
    })
);

/**
 * @route DELETE /follows/:targetUserID
 * @desc Ne plus suivre un utilisateur
 * @access Private
 */
router.delete("/:targetUserID", 
    AuthMiddleware.verifyToken,
    validate([
        param('targetUserID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur cible invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const fromUserID = req.user.userID;
        const targetUserID = req.params.targetUserID;
        
        logger.info(`Utilisateur ${fromUserID} ne suit plus ${targetUserID}`);
        
        const result = await FollowsService.unfollowUser(fromUserID, targetUserID);
        return { 
            ...result, 
            message: 'Utilisateur non suivi avec succès' 
        };
    })
);

/**
 * @route GET /follows/followers/:userID
 * @desc Récupérer les followers d'un utilisateur
 * @access Public
 */
router.get("/followers/:userID", 
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
        const { page, limit } = normalizePaginationParams(req.query);
        
        logger.info(`Récupération des followers pour l'utilisateur ${targetUserID}`);
        
        const result = await FollowsService.getFollowers(targetUserID, page, limit);
        return result;
    })
);

/**
 * @route GET /follows/following/:userID
 * @desc Récupérer les utilisateurs suivis par un utilisateur
 * @access Public
 */
router.get("/following/:userID", 
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const fromUserID = req.params.userID;
        const { page, limit } = normalizePaginationParams(req.query);
        
        logger.info(`Récupération des utilisateurs suivis par ${fromUserID}`);
        
        const result = await FollowsService.getFollowedUsers(fromUserID, page, limit);
        return result;
    })
);

/**
 * @route GET /follows/check/:targetUserID
 * @desc Vérifier si l'utilisateur connecté suit un utilisateur cible
 * @access Private
 */
router.get("/check/:targetUserID", 
    AuthMiddleware.verifyToken,
    validate([
        param('targetUserID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur cible invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const fromUserID = req.user.userID;
        const targetUserID = req.params.targetUserID;
        
        const isFollowing = await FollowsService.isFollowing(fromUserID, targetUserID);
        return { isFollowing };
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
