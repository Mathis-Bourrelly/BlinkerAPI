const express = require('express');
const { body, param, query } = require('express-validator');
const AuthMiddleware = require('../core/middlewares/AuthMiddleware');
const ReportsService = require('../services/reports.service');
const { validate } = require('../utils/validation.utils');
const { withStandardResponse, errorHandler } = require('../utils/response.utils');
const { logger } = require('../utils/logger.utils');
const { normalizePaginationParams } = require('../utils/pagination.utils');
const { isValidUUID } = require('../utils/validation.utils');

const router = express.Router();

/**
 * @route POST /reports
 * @desc Signale un Blink
 * @access Private
 */
router.post('/',
    AuthMiddleware.verifyToken,
    validate([
        body('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de Blink invalide');
            }
            return true;
        }),
        body('reason').isIn(['inappropriate', 'spam', 'harassment', 'violence', 'other'])
            .withMessage('Raison invalide'),
        body('description').optional().isString().isLength({ min: 0, max: 500 })
            .withMessage('La description ne doit pas dépasser 500 caractères')
    ]),
    withStandardResponse(async (req) => {
        logger.info(`Signalement d'un Blink par l'utilisateur: ${req.user.userID}`);

        const report = await ReportsService.createReport(
            req.user.userID,
            req.body.blinkID,
            req.body.reason,
            req.body.description || null
        );

        return {
            report,
            message: 'Blink signalé avec succès'
        };
    })
);

/**
 * @route GET /reports
 * @desc Récupère tous les signalements (admin)
 * @access Private (Admin)
 */
router.get('/',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAdminRole,
    validate([
        query('status').optional().isIn(['pending', 'reviewed', 'rejected', 'action_taken'])
            .withMessage('Statut invalide'),
        query('reason').optional().isIn(['inappropriate', 'spam', 'harassment', 'violence', 'other'])
            .withMessage('Raison invalide'),
        query('minReports').optional().isInt({ min: 1 })
            .withMessage('Le nombre minimum de signalements doit être un entier positif')
    ]),
    withStandardResponse(async (req) => {
        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);
        const { status, reason, minReports } = req.query;

        return await ReportsService.getReports({
            page,
            limit,
            status,
            reason,
            minReports: minReports ? parseInt(minReports) : undefined
        });
    })
);

/**
 * @route GET /reports/counts
 * @desc Récupère le nombre de signalements par Blink (admin)
 * @access Private (Admin)
 */
router.get('/counts',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAdminRole,
    withStandardResponse(async (req) => {
        return await ReportsService.getReportCountsByBlink();
    })
);

/**
 * @route GET /reports/:id
 * @desc Récupère un signalement par son ID (admin)
 * @access Private (Admin)
 */
router.get('/:id',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAdminRole,
    validate([
        param('id').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de signalement invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        return await ReportsService.getReportById(req.params.id);
    })
);

/**
 * @route PUT /reports/:id/status
 * @desc Met à jour le statut d'un signalement (admin)
 * @access Private (Admin)
 */
router.put('/:id/status',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAdminRole,
    validate([
        param('id').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de signalement invalide');
            }
            return true;
        }),
        body('status').isIn(['pending', 'reviewed', 'rejected', 'action_taken'])
            .withMessage('Statut invalide')
    ]),
    withStandardResponse(async (req) => {
        await ReportsService.updateReportStatus(
            req.params.id,
            req.body.status,
            req.user.userID
        );

        return { message: 'Statut du signalement mis à jour avec succès' };
    })
);

/**
 * @route DELETE /reports/blink/:blinkID
 * @desc Supprime un Blink signalé (admin)
 * @access Private (Admin)
 */
router.delete('/blink/:blinkID',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAdminRole,
    validate([
        param('blinkID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID de Blink invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        return await ReportsService.deleteReportedBlink(
            req.params.blinkID,
            req.user.userID
        );
    })
);

// Ajouter le middleware de gestion d'erreurs à la fin
router.use(errorHandler);

module.exports = {
    initializeRoutes: () => router,
};
