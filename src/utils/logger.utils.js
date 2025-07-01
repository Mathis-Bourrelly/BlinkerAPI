/**
 * Utilitaire de journalisation standardisé
 * Utilise Winston pour la journalisation
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Créer le répertoire de logs s'il n'existe pas
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Définir les niveaux de journalisation personnalisés
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Définir les couleurs pour chaque niveau
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Ajouter les couleurs à Winston
winston.addColors(colors);

// Définir le format de journalisation
const format = winston.format.combine(
    // Ajouter l'horodatage
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Ajouter les couleurs uniquement pour les niveaux (pas pour les messages HTTP qui sont déjà colorisés)
    winston.format.colorize({ level: true, message: false, colors }),
    // Définir le format du message
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Définir les transports (où les logs seront stockés)
const transports = [
    // Console pour tous les niveaux
    new winston.transports.Console(),
    // Fichier pour les erreurs
    new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
    }),
    // Fichier pour tous les logs
    new winston.transports.File({ filename: path.join(logDir, 'all.log') }),
];

// Créer l'instance de logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports,
});

/**
 * Fonction pour coloriser les méthodes HTTP
 * @param {string} method - Méthode HTTP
 * @returns {string} - Méthode HTTP colorisée
 */
const colorizeMethod = (method) => {
    switch (method) {
        case 'GET':
            return '\x1b[32m' + method + '\x1b[0m'; // Vert
        case 'POST':
            return '\x1b[33m' + method + '\x1b[0m'; // Jaune
        case 'PUT':
            return '\x1b[34m' + method + '\x1b[0m'; // Bleu
        case 'DELETE':
            return '\x1b[31m' + method + '\x1b[0m'; // Rouge
        default:
            return '\x1b[37m' + method + '\x1b[0m'; // Blanc
    }
};

/**
 * Fonction pour coloriser les codes de statut HTTP
 * @param {number} statusCode - Code de statut HTTP
 * @returns {string} - Code de statut HTTP colorisé
 */
const colorizeStatusCode = (statusCode) => {
    if (statusCode >= 500) {
        return '\x1b[31m' + statusCode + '\x1b[0m'; // Rouge pour 5xx
    } else if (statusCode >= 400) {
        return '\x1b[33m' + statusCode + '\x1b[0m'; // Jaune pour 4xx
    } else if (statusCode >= 300) {
        return '\x1b[36m' + statusCode + '\x1b[0m'; // Cyan pour 3xx
    } else if (statusCode >= 200) {
        return '\x1b[32m' + statusCode + '\x1b[0m'; // Vert pour 2xx
    } else {
        return '\x1b[37m' + statusCode + '\x1b[0m'; // Blanc pour autres
    }
};

/**
 * Middleware pour journaliser les requêtes HTTP
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const httpLogger = (req, res, next) => {
    // Journaliser la requête
    const method = colorizeMethod(req.method);
    const url = '\x1b[36m' + req.url + '\x1b[0m'; // Cyan pour l'URL
    logger.http(`${method} ${url}`);

    // Enregistrer l'heure de début
    const start = Date.now();

    // Une fois la réponse envoyée, journaliser le temps de réponse
    res.on('finish', () => {
        const duration = Date.now() - start;
        const durationStr = '\x1b[35m' + duration + 'ms\x1b[0m'; // Magenta pour la durée
        const statusCode = colorizeStatusCode(res.statusCode);
        const ip = '\x1b[90m' + (req.ip || req.socket.remoteAddress) + '\x1b[0m'; // Gris pour l'IP

        logger.http(`${method} ${url} ${statusCode} ${durationStr} from ${ip}`);
    });

    next();
};

module.exports = {
    logger,
    httpLogger,
};
