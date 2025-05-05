const BlinkLifetimes = require('../models/blinkLifetimes');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');

class BlinkLifetimesRepository {
    /**
     * Enregistre la durée de vie d'un blink supprimé
     * @param {Object} data - Données de durée de vie
     * @param {string} data.userID - ID de l'utilisateur
     * @param {string} data.blinkID - ID du blink
     * @param {Date} data.createdAt - Date de création du blink
     * @param {Date} data.deletedAt - Date de suppression du blink
     * @param {number} data.lifetime - Durée de vie en secondes
     * @param {Object} transaction - Transaction Sequelize (optionnelle)
     * @returns {Promise<Object>} L'enregistrement créé
     */
    async recordBlinkLifetime({ userID, blinkID, createdAt, deletedAt, lifetime }, transaction = null) {
        try {
            return await BlinkLifetimes.create({
                userID,
                blinkID,
                createdAt,
                deletedAt,
                lifetime
            }, { transaction });
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la durée de vie du blink:', error);
            throw error;
        }
    }

    /**
     * Calcule la durée de vie moyenne des blinks d'un utilisateur
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<number|null>} La durée de vie moyenne en secondes ou null si aucune donnée
     */
    async getAverageLifetime(userID) {
        try {
            const result = await sequelize.query(`
                SELECT AVG(lifetime) as "averageLifetime"
                FROM "BlinkLifetimes"
                WHERE "userID" = :userID
            `, {
                replacements: { userID },
                type: sequelize.QueryTypes.SELECT
            });

            if (result && result[0] && result[0].averageLifetime) {
                return Math.round(parseFloat(result[0].averageLifetime));
            }
            
            return null;
        } catch (error) {
            console.error('Erreur lors du calcul de la durée de vie moyenne:', error);
            throw error;
        }
    }

    /**
     * Récupère toutes les durées de vie des blinks d'un utilisateur
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Array>} Liste des durées de vie
     */
    async getBlinkLifetimesByUser(userID) {
        try {
            return await BlinkLifetimes.findAll({
                where: { userID },
                order: [['deletedAt', 'DESC']]
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des durées de vie:', error);
            throw error;
        }
    }
}

module.exports = new BlinkLifetimesRepository();
