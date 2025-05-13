const ReportsRepository = require('../repository/reports.repository');
const BlinkRepository = require('../repository/blinks.repository');
const UsersRepository = require('../repository/users.repository');
const ErrorCodes = require('../../constants/errorCodes');
const { sequelize } = require('../core/postgres');

class ReportsService {
    /**
     * Crée un nouveau signalement
     * @param {string} reporterID - ID de l'utilisateur qui signale
     * @param {string} blinkID - ID du Blink signalé
     * @param {string} reason - Raison du signalement
     * @param {string} description - Description détaillée du signalement
     * @returns {Promise<Object>} Le signalement créé
     */
    async createReport(reporterID, blinkID, reason, description) {
        try {
            // Vérifier si le Blink existe
            await BlinkRepository.getBlinkById(blinkID);

            // Vérifier si l'utilisateur a déjà signalé ce Blink
            const hasReported = await ReportsRepository.hasUserReportedBlink(reporterID, blinkID);
            if (hasReported) {
                throw { message: ErrorCodes.Reports?.AlreadyReported || 'Vous avez déjà signalé ce Blink' };
            }

            // Créer le signalement
            const report = await ReportsRepository.createReport({
                reporterID,
                blinkID,
                reason,
                description,
                status: 'pending'
            });

            return report;
        } catch (error) {
            console.error('Erreur lors de la création du signalement:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les signalements avec pagination et filtres
     * @param {Object} options - Options de filtrage et pagination
     * @returns {Promise<Object>} Résultats paginés
     */
    async getReports(options) {
        try {
            return await ReportsRepository.getReports(options);
        } catch (error) {
            console.error('Erreur lors de la récupération des signalements:', error);
            throw error;
        }
    }

    /**
     * Récupère un signalement par son ID
     * @param {string} reportID - ID du signalement
     * @returns {Promise<Object>} Le signalement trouvé
     */
    async getReportById(reportID) {
        try {
            return await ReportsRepository.getReportById(reportID);
        } catch (error) {
            console.error('Erreur lors de la récupération du signalement:', error);
            throw error;
        }
    }

    /**
     * Met à jour le statut d'un signalement
     * @param {string} reportID - ID du signalement
     * @param {string} status - Nouveau statut
     * @param {string} reviewerID - ID de l'administrateur qui examine le signalement
     * @returns {Promise<Object>} Le signalement mis à jour
     */
    async updateReportStatus(reportID, status, reviewerID) {
        try {
            // Vérifier si le signalement existe
            const report = await ReportsRepository.getReportById(reportID);

            // Vérifier si l'utilisateur est un administrateur
            const reviewer = await UsersRepository.getUserById(reviewerID);
            if (reviewer.role !== 'admin') {
                throw { message: ErrorCodes.Login?.AccessDenied || 'Accès non autorisé' };
            }

            // Mettre à jour le statut
            const updateData = {
                status,
                reviewedBy: reviewerID,
                reviewedAt: new Date()
            };

            return await ReportsRepository.updateReportStatus(reportID, updateData);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut du signalement:', error);
            throw error;
        }
    }

    /**
     * Récupère le nombre de signalements par Blink
     * @returns {Promise<Array>} Liste des Blinks avec leur nombre de signalements
     */
    async getReportCountsByBlink() {
        try {
            return await ReportsRepository.getReportCountsByBlink();
        } catch (error) {
            console.error('Erreur lors de la récupération du nombre de signalements par Blink:', error);
            throw error;
        }
    }

    /**
     * Supprime un Blink signalé (action d'administration)
     * @param {string} blinkID - ID du Blink à supprimer
     * @param {string} adminID - ID de l'administrateur qui effectue l'action
     * @returns {Promise<Object>} Résultat de l'opération
     */
    async deleteReportedBlink(blinkID, adminID) {
        const transaction = await sequelize.transaction();

        try {
            // Vérifier si l'utilisateur est un administrateur
            const admin = await UsersRepository.getUserById(adminID);
            if (admin.role !== 'admin') {
                throw { message: ErrorCodes.Login?.AccessDenied || 'Accès non autorisé' };
            }

            // Supprimer le Blink
            await BlinkRepository.deleteBlink(blinkID, transaction);

            // Mettre à jour tous les signalements associés à ce Blink
            await Reports.update(
                {
                    status: 'action_taken',
                    reviewedBy: adminID,
                    reviewedAt: new Date()
                },
                {
                    where: { blinkID },
                    transaction
                }
            );

            await transaction.commit();
            return { message: 'Blink supprimé avec succès' };
        } catch (error) {
            await transaction.rollback();
            console.error('Erreur lors de la suppression du Blink signalé:', error);
            throw error;
        }
    }
}

module.exports = new ReportsService();
