/**
 * Utilitaires pour la validation des données
 */
const { validationResult } = require('express-validator');

/**
 * Middleware pour valider les requêtes avec express-validator
 * @param {Function} validations - Fonction de validation express-validator
 * @returns {Function} Middleware Express
 */
function validate(validations) {
    return async (req, res, next) => {
        // Exécuter toutes les validations
        await Promise.all(validations.map(validation => validation.run(req)));
        
        // Vérifier s'il y a des erreurs
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        
        // Formater les erreurs
        const formattedErrors = errors.array().map(error => ({
            field: error.param,
            message: error.msg
        }));
        
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: formattedErrors
        });
    };
}

/**
 * Valide un UUID
 * @param {string} uuid - UUID à valider
 * @returns {boolean} true si l'UUID est valide, false sinon
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Valide une URL
 * @param {string} url - URL à valider
 * @returns {boolean} true si l'URL est valide, false sinon
 */
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} true si l'email est valide, false sinon
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valide un mot de passe fort
 * @param {string} password - Mot de passe à valider
 * @param {Object} options - Options de validation
 * @param {number} [options.minLength=12] - Longueur minimale
 * @param {boolean} [options.requireUppercase=true] - Exiger une majuscule
 * @param {boolean} [options.requireLowercase=true] - Exiger une minuscule
 * @param {boolean} [options.requireNumbers=true] - Exiger un chiffre
 * @param {boolean} [options.requireSymbols=true] - Exiger un symbole
 * @returns {boolean} true si le mot de passe est valide, false sinon
 */
function isStrongPassword(password, {
    minLength = 12,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSymbols = true
} = {}) {
    if (!password || password.length < minLength) return false;
    
    if (requireUppercase && !/[A-Z]/.test(password)) return false;
    if (requireLowercase && !/[a-z]/.test(password)) return false;
    if (requireNumbers && !/[0-9]/.test(password)) return false;
    if (requireSymbols && !/[^A-Za-z0-9]/.test(password)) return false;
    
    return true;
}

module.exports = {
    validate,
    isValidUUID,
    isValidURL,
    isValidEmail,
    isStrongPassword
};
