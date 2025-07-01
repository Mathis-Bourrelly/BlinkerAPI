const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const AuthMiddleware = require('../core/middlewares/authMiddleware');
const TagsService = require('../services/tags.service');
const BlinkService = require('../services/blinks.service');
const { validate } = require('../utils/validation.utils');
const { withStandardResponse } = require('../utils/response.utils');
const { isValidUUID } = require('../utils/validation.utils');

/**
 * @route GET /tags/popular
 * @desc Récupère les tags les plus populaires selon différents critères
 * @access Public
 */
router.get('/popular',
    validate([
        query('timeFilter').optional().isIn(['24h', '7d', '30d', 'all']).withMessage('Filtre temporel invalide'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('La limite doit être entre 1 et 50')
    ]),
    withStandardResponse(async (req) => {
        const { timeFilter = 'all', limit = 20 } = req.query;
        
        const popularTags = await TagsService.getPopularTags(timeFilter, parseInt(limit));
        return { 
            tags: popularTags, 
            timeFilter,
            message: 'Tags populaires récupérés avec succès' 
        };
    })
);

/**
 * @route GET /tags/trending
 * @desc Récupère les tags tendances selon tous les critères temporels
 * @access Public
 */
router.get('/trending',
    withStandardResponse(async (req) => {
        const trendingTags = await TagsService.getTrendingTags();
        return { 
            trending: trendingTags, 
            message: 'Tags tendances récupérés avec succès' 
        };
    })
);

/**
 * @route GET /tags/search
 * @desc Recherche des tags pour l'autocomplétion
 * @access Public
 */
router.get('/search',
    validate([
        query('q').notEmpty().withMessage('Le terme de recherche est requis'),
        query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('La limite doit être entre 1 et 20')
    ]),
    withStandardResponse(async (req) => {
        const { q: query, limit = 10 } = req.query;
        
        const tags = await TagsService.searchTags(query, parseInt(limit));
        return { 
            tags, 
            query,
            message: 'Recherche de tags effectuée avec succès' 
        };
    })
);

/**
 * @route GET /tags/:tagNames/blinks
 * @desc Récupère les blinks associés à des tags spécifiques
 * @access Public
 */
router.get('/:tagNames/blinks',
    validate([
        param('tagNames').notEmpty().withMessage('Les noms de tags sont requis'),
        query('page').optional().isInt({ min: 1 }).withMessage('Le numéro de page doit être un entier positif'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('La limite doit être entre 1 et 50')
    ]),
    withStandardResponse(async (req) => {
        const { tagNames } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        // Diviser les noms de tags (séparés par des virgules)
        const tagNamesArray = tagNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
        
        if (tagNamesArray.length === 0) {
            throw new Error('Au moins un nom de tag valide est requis');
        }
        
        const result = await TagsService.getBlinksByTags(tagNamesArray, parseInt(page), parseInt(limit));
        
        // Si on a des IDs de blinks, récupérer les détails complets
        if (result.blinkIDs.length > 0) {
            // Pour l'instant, on retourne juste les IDs. 
            // Dans une implémentation complète, on pourrait récupérer les blinks complets
            return {
                ...result,
                tags: tagNamesArray,
                message: 'Blinks récupérés avec succès'
            };
        }
        
        return {
            ...result,
            tags: tagNamesArray,
            message: 'Aucun blink trouvé pour ces tags'
        };
    })
);

/**
 * @route POST /tags/validate
 * @desc Valide un tableau de tags
 * @access Private
 */
router.post('/validate',
    AuthMiddleware.verifyToken,
    validate([
        body('tags').isArray().withMessage('Les tags doivent être fournis sous forme de tableau'),
        body('tags.*').isString().withMessage('Chaque tag doit être une chaîne de caractères')
    ]),
    withStandardResponse(async (req) => {
        const { tags } = req.body;
        
        try {
            TagsService.validateTagNames(tags);
            return { 
                valid: true, 
                tags,
                message: 'Tags valides' 
            };
        } catch (error) {
            return { 
                valid: false, 
                error: error.message,
                tags,
                message: 'Validation des tags échouée' 
            };
        }
    })
);

/**
 * @route GET /tags/stats
 * @desc Récupère des statistiques détaillées sur l'utilisation des tags
 * @access Public
 */
router.get('/stats',
    validate([
        query('timeFilter').optional().isIn(['24h', '7d', '30d', 'all']).withMessage('Filtre temporel invalide'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('La limite doit être entre 1 et 100')
    ]),
    withStandardResponse(async (req) => {
        const { timeFilter = 'all', limit = 50 } = req.query;
        
        const stats = await TagsService.getPopularTags(timeFilter, parseInt(limit));
        
        // Calculer quelques statistiques supplémentaires
        const totalUsage = stats.reduce((sum, tag) => sum + parseInt(tag.usageCount), 0);
        const totalUniqueBlinks = stats.reduce((sum, tag) => sum + parseInt(tag.uniqueBlinks), 0);
        
        return {
            stats,
            summary: {
                totalTags: stats.length,
                totalUsage,
                totalUniqueBlinks,
                timeFilter
            },
            message: 'Statistiques des tags récupérées avec succès'
        };
    })
);

module.exports = router;
