/**
 * Utility functions for error handling
 */
const ErrorCodes = require('../../constants/errorCodes');

/**
 * Crée un objet d'erreur standardisé
 * @param {string} errorCode - Code d'erreur depuis ErrorCodes
 * @param {Error|null} originalError - Erreur originale (optionnelle)
 * @returns {Object} Objet d'erreur standardisé
 */
function createError(errorCode, originalError = null) {
    // Utiliser le code d'erreur fourni ou un code générique en cas d'erreur inconnue
    const message = errorCode || ErrorCodes.Base.UnknownError;
    
    // Logger l'erreur originale si elle existe
    if (originalError) {
        console.error(`Erreur originale:`, originalError);
    }
    
    return { message };
}

/**
 * Wrapper pour les opérations avec transaction
 * @param {Function} operation - Fonction asynchrone à exécuter dans la transaction
 * @param {Object} sequelize - Instance Sequelize
 * @param {string} errorCode - Code d'erreur en cas d'échec
 * @returns {Promise<*>} Résultat de l'opération
 */
async function withTransaction(operation, sequelize, errorCode = ErrorCodes.Base.UnknownError) {
    const transaction = await sequelize.transaction();
    try {
        const result = await operation(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        throw createError(error.message || errorCode, error);
    }
}

module.exports = {
    createError,
    withTransaction
};
