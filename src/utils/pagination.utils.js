/**
 * Utilitaires pour la pagination
 */

/**
 * Calcule l'offset pour la pagination
 * @param {number} page - Numéro de la page (commence à 1)
 * @param {number} limit - Nombre d'éléments par page
 * @returns {number} Offset pour la requête SQL
 */
function calculateOffset(page, limit) {
    return (Math.max(1, page) - 1) * limit;
}

/**
 * Normalise les paramètres de pagination
 * @param {Object} params - Paramètres de pagination
 * @param {number|string} [params.page=1] - Numéro de la page
 * @param {number|string} [params.limit=10] - Nombre d'éléments par page
 * @param {number} [params.maxLimit=100] - Limite maximale d'éléments par page
 * @returns {Object} Paramètres normalisés {page, limit, offset}
 */
function normalizePaginationParams({ page = 1, limit = 10, maxLimit = 100 }) {
    // Convertir en nombres et s'assurer qu'ils sont positifs
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(maxLimit, Math.max(1, Number(limit) || 10));
    
    return {
        page: normalizedPage,
        limit: normalizedLimit,
        offset: calculateOffset(normalizedPage, normalizedLimit)
    };
}

/**
 * Formate la réponse paginée
 * @param {Object} options - Options de formatage
 * @param {number} options.page - Numéro de la page actuelle
 * @param {number} options.limit - Nombre d'éléments par page
 * @param {number} options.total - Nombre total d'éléments
 * @param {Array} options.data - Données à inclure dans la réponse
 * @returns {Object} Réponse paginée formatée
 */
function formatPaginatedResponse({ page, limit, total, data }) {
    const totalPages = Math.ceil(total / limit);
    
    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        data
    };
}

module.exports = {
    calculateOffset,
    normalizePaginationParams,
    formatPaginatedResponse
};
