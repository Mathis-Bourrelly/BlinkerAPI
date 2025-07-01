/**
 * Utility functions for URL construction
 */

/**
 * Construit l'URL complète de l'avatar à partir du nom du fichier.
 * @param {string} filename - Nom du fichier de l'avatar.
 * @returns {string} URL complète de l'avatar.
 */
function buildAvatarUrl(filename) {
    if (!filename) return null;

    // Toujours utiliser l'URL absolue du serveur API
    // En développement: http://localhost:3011
    // En production: https://dev.blinker.eterny.fr
    const apiUrl = process.env.API_URL ||
                  (process.env.NODE_ENV === 'production' ?
                   'https://dev.blinker.eterny.fr' :
                   'http://localhost:3011');

    return `${apiUrl}/uploads/${filename}`;
}

module.exports = {
    buildAvatarUrl
};
