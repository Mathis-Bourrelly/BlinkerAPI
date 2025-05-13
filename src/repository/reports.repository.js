const { Op } = require('sequelize');
const Reports = require('../models/reports');
const Blinks = require('../models/blinks');
const Users = require('../models/users');
const Profiles = require('../models/profiles');
const BlinkContents = require('../models/blinkContents');
const ErrorCodes = require('../../constants/errorCodes');
const { sequelize } = require('../core/postgres');
const { formatPaginatedResponse, normalizePaginationParams } = require('../utils/pagination.utils');
const BaseRepository = require('./base.repository');

class ReportsRepository extends BaseRepository {
    constructor() {
        super(Reports, ErrorCodes.Reports || { NotFound: 'Report not found' });
    }

    /**
     * Crée un nouveau signalement
     * @param {Object} reportData - Données du signalement
     * @returns {Promise<Object>} Le signalement créé
     */
    async createReport(reportData) {
        return this.create(reportData);
    }

    /**
     * Récupère un signalement par son ID
     * @param {string} reportID - ID du signalement
     * @returns {Promise<Object>} Le signalement trouvé
     */
    async getReportById(reportID) {
        const report = await Reports.findOne({
            where: { reportID },
            include: [
                {
                    model: Users,
                    as: 'reporter',
                    attributes: ['userID', 'email', 'role'],
                    include: [
                        {
                            model: Profiles,
                            attributes: ['username', 'display_name', 'avatar_url']
                        }
                    ]
                },
                {
                    model: Users,
                    as: 'reviewer',
                    attributes: ['userID', 'email', 'role'],
                    include: [
                        {
                            model: Profiles,
                            attributes: ['username', 'display_name', 'avatar_url']
                        }
                    ]
                },
                {
                    model: Blinks,
                    include: [
                        {
                            model: BlinkContents,
                            as: 'contents'
                        },
                        {
                            model: Profiles,
                            as: 'profile',
                            attributes: ['display_name', 'username', 'avatar_url', 'userID']
                        }
                    ]
                }
            ]
        });

        if (!report) {
            throw { message: ErrorCodes.Reports?.NotFound || 'Report not found' };
        }

        return report;
    }

    /**
     * Récupère tous les signalements avec pagination et filtres
     * @param {Object} options - Options de filtrage et pagination
     * @param {number} options.page - Numéro de la page
     * @param {number} options.limit - Nombre d'éléments par page
     * @param {string} options.status - Statut des signalements à récupérer
     * @param {string} options.reason - Raison des signalements à récupérer
     * @param {number} options.minReports - Nombre minimum de signalements pour un Blink
     * @returns {Promise<Object>} Résultats paginés
     */
    async getReports({ page = 1, limit = 10, status, reason, minReports }) {
        const { offset, limit: normalizedLimit } = normalizePaginationParams({ page, limit });

        // Construire la clause WHERE en fonction des filtres
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        if (reason) {
            whereClause.reason = reason;
        }

        // Si minReports est spécifié, nous devons d'abord trouver les blinkIDs qui ont au moins ce nombre de signalements
        let blinkIDs = [];
        if (minReports && minReports > 0) {
            const reportCounts = await Reports.findAll({
                attributes: [
                    'blinkID',
                    [sequelize.fn('COUNT', sequelize.col('blinkID')), 'reportCount']
                ],
                group: ['blinkID'],
                having: sequelize.literal(`COUNT("blinkID") >= ${minReports}`),
                raw: true
            });

            blinkIDs = reportCounts.map(report => report.blinkID);
            
            // Si aucun Blink n'a le nombre minimum de signalements, retourner un résultat vide
            if (blinkIDs.length === 0) {
                return formatPaginatedResponse({
                    page,
                    limit: normalizedLimit,
                    total: 0,
                    data: []
                });
            }

            // Ajouter la condition sur les blinkIDs
            whereClause.blinkID = {
                [Op.in]: blinkIDs
            };
        }

        // Récupérer les signalements avec pagination
        const { count, rows } = await Reports.findAndCountAll({
            where: whereClause,
            limit: normalizedLimit,
            offset,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Users,
                    as: 'reporter',
                    attributes: ['userID', 'email', 'role'],
                    include: [
                        {
                            model: Profiles,
                            attributes: ['username', 'display_name', 'avatar_url']
                        }
                    ]
                },
                {
                    model: Blinks,
                    include: [
                        {
                            model: BlinkContents,
                            as: 'contents',
                            limit: 1, // Limiter à un seul contenu pour l'aperçu
                            order: [['position', 'ASC']]
                        },
                        {
                            model: Profiles,
                            as: 'profile',
                            attributes: ['display_name', 'username', 'avatar_url', 'userID']
                        }
                    ]
                }
            ]
        });

        return formatPaginatedResponse({
            page,
            limit: normalizedLimit,
            total: count,
            data: rows
        });
    }

    /**
     * Met à jour le statut d'un signalement
     * @param {string} reportID - ID du signalement
     * @param {Object} updateData - Données de mise à jour
     * @returns {Promise<Object>} Le signalement mis à jour
     */
    async updateReportStatus(reportID, updateData) {
        const report = await this.getById(reportID);
        
        if (!report) {
            throw { message: ErrorCodes.Reports?.NotFound || 'Report not found' };
        }

        return await this.update(reportID, updateData);
    }

    /**
     * Récupère le nombre de signalements par Blink
     * @returns {Promise<Array>} Liste des Blinks avec leur nombre de signalements
     */
    async getReportCountsByBlink() {
        return await Reports.findAll({
            attributes: [
                'blinkID',
                [sequelize.fn('COUNT', sequelize.col('blinkID')), 'reportCount']
            ],
            group: ['blinkID'],
            order: [[sequelize.literal('reportCount'), 'DESC']],
            include: [
                {
                    model: Blinks,
                    include: [
                        {
                            model: BlinkContents,
                            as: 'contents',
                            limit: 1,
                            order: [['position', 'ASC']]
                        },
                        {
                            model: Profiles,
                            as: 'profile',
                            attributes: ['display_name', 'username', 'avatar_url', 'userID']
                        }
                    ]
                }
            ]
        });
    }

    /**
     * Vérifie si un utilisateur a déjà signalé un Blink
     * @param {string} reporterID - ID de l'utilisateur qui signale
     * @param {string} blinkID - ID du Blink signalé
     * @returns {Promise<boolean>} True si l'utilisateur a déjà signalé ce Blink
     */
    async hasUserReportedBlink(reporterID, blinkID) {
        const report = await Reports.findOne({
            where: {
                reporterID,
                blinkID
            }
        });

        return !!report;
    }
}

module.exports = new ReportsRepository();
