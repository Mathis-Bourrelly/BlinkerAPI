const express = require("express");
const ProfilesService = require("../services/profiles.service");
const multer = require("multer");
const AuthMiddleware = require("../core/middlewares/authMiddleware");
const { body, param } = require('express-validator');
const { validate, isValidUUID } = require('../utils/validation.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');

const router = express.Router();
const upload = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        // Vérifier le type de fichier
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'), false);
        }
    }
});

/**
 * @route POST /profiles
 * @desc Crée un nouveau profil
 * @access Private
 */
router.post("/", 
    AuthMiddleware.verifyToken, 
    upload.single('avatar'),
    validate([
        body('username').notEmpty().withMessage("Le nom d'utilisateur est requis"),
        body('display_name').notEmpty().withMessage("Le nom d'affichage est requis")
    ]),
    withStandardResponse(async (req) => {
        logger.info(`Création d'un profil pour l'utilisateur ${req.user.userID}`);
        
        const profile = await ProfilesService.createProfile(
            req.body.name,
            req.body.username,
            req.body.display_name,
            req.body.bio,
            req.file
        );
        
        return { profile, status: 201 };
    })
);

/**
 * @route GET /profiles/:userID
 * @desc Récupère un profil par son ID utilisateur
 * @access Private
 */
router.get("/:userID", 
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
        const profile = await ProfilesService.getProfileByUserID(req.params.userID, req.user.userID);
        return profile;
    })
);

/**
 * @route POST /profiles/upload-avatar/:userID
 * @desc Met à jour l'avatar d'un profil
 * @access Private
 */
router.post('/upload-avatar/:userID', 
    AuthMiddleware.verifyToken, 
    upload.single('avatar'),
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.params.userID;
        const file = req.file;
        
        // Vérifier que l'utilisateur modifie son propre profil ou est admin
        if (req.user.userID !== userID && req.user.role !== 'admin') {
            const error = new Error('Vous n\'êtes pas autorisé à modifier ce profil');
            error.status = 403;
            throw error;
        }
        
        if (!file) {
            const error = new Error('Aucun fichier n\'a été uploadé');
            error.status = 400;
            throw error;
        }
        
        logger.info(`Mise à jour de l'avatar pour l'utilisateur ${userID}`);
        
        const avatarUrl = await ProfilesService.updateAvatar(userID, file);
        
        return { 
            message: 'Avatar uploadé avec succès', 
            avatarUrl 
        };
    })
);

/**
 * @route PUT /profiles/:userID
 * @desc Met à jour un profil
 * @access Private
 */
router.put('/:userID', 
    AuthMiddleware.verifyToken,
    validate([
        param('userID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID utilisateur invalide');
            }
            return true;
        }),
        body('username').optional().isString().withMessage("Le nom d'utilisateur doit être une chaîne de caractères"),
        body('display_name').optional().isString().withMessage("Le nom d'affichage doit être une chaîne de caractères"),
        body('bio').optional().isString().withMessage("La bio doit être une chaîne de caractères")
    ]),
    withStandardResponse(async (req) => {
        const userID = req.params.userID;
        
        // Vérifier que l'utilisateur modifie son propre profil ou est admin
        if (req.user.userID !== userID && req.user.role !== 'admin') {
            const error = new Error('Vous n\'êtes pas autorisé à modifier ce profil');
            error.status = 403;
            throw error;
        }
        
        logger.info(`Mise à jour du profil pour l'utilisateur ${userID}`);
        
        const profile = await ProfilesService.updateProfile(userID, {
            username: req.body.username,
            display_name: req.body.display_name,
            bio: req.body.bio
        });
        
        return { 
            message: 'Profil mis à jour avec succès', 
            profile 
        };
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
