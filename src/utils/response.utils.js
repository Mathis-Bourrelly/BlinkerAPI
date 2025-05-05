/**
 * Utilitaires pour standardiser les réponses API
 */

/**
 * Crée une réponse de succès standardisée
 * @param {Object} options - Options de la réponse
 * @param {*} options.data - Données à inclure dans la réponse
 * @param {string} [options.message] - Message de succès
 * @param {number} [options.status=200] - Code de statut HTTP
 * @returns {Object} Réponse standardisée
 */
function successResponse({ data, message = 'Opération réussie', status = 200 }) {
    return {
        success: true,
        status,
        message,
        data
    };
}

/**
 * Crée une réponse d'erreur standardisée
 * @param {Object} options - Options de la réponse
 * @param {string} options.message - Message d'erreur
 * @param {*} [options.errors] - Détails des erreurs
 * @param {number} [options.status=400] - Code de statut HTTP
 * @returns {Object} Réponse standardisée
 */
function errorResponse({ message, errors = null, status = 400 }) {
    return {
        success: false,
        status,
        message,
        errors
    };
}

/**
 * Middleware pour envoyer une réponse standardisée
 * @param {Function} handler - Gestionnaire de route Express
 * @returns {Function} Middleware Express
 */
function withStandardResponse(handler) {
    return async (req, res, next) => {
        try {
            const result = await handler(req, res, next);
            
            // Si la réponse a déjà été envoyée, ne rien faire
            if (res.headersSent) {
                return;
            }
            
            // Envoyer une réponse standardisée
            const response = successResponse({
                data: result,
                status: res.statusCode || 200
            });
            
            return res.status(response.status).json(response);
        } catch (error) {
            // Passer l'erreur au middleware de gestion d'erreurs
            next(error);
        }
    };
}

/**
 * Middleware de gestion d'erreurs standardisé
 * @param {Error} err - Erreur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
function errorHandler(err, req, res, next) {
    console.error('Erreur API:', err);
    
    // Déterminer le statut HTTP
    const status = err.status || 500;
    
    // Créer une réponse d'erreur standardisée
    const response = errorResponse({
        message: err.message || 'Erreur interne du serveur',
        errors: err.errors || null,
        status
    });
    
    // Envoyer la réponse
    res.status(status).json(response);
}

module.exports = {
    successResponse,
    errorResponse,
    withStandardResponse,
    errorHandler
};
