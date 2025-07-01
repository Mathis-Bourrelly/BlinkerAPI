const express = require('express');
const { DateTime } = require('luxon');
let cors = require('cors');
const {expressjwt: jwt} = require("express-jwt");
const { initializeSwagger } = require('./swagger');


const initJsonHandlerMiddleware = (app) => app.use(express.json({
    // Ignorer les requêtes GET pour le parsing JSON
    verify: (req, res, buf, encoding) => {
        if (req.method === 'GET') {
            req.rawBody = buf.toString(encoding || 'utf8');
            throw new Error('No JSON parsing for GET requests');
        }
    }
}));

// Middleware pour gérer les erreurs de parsing JSON
const handleJsonErrors = (app) => {
    app.use((err, req, res, next) => {
        if (err.message === 'No JSON parsing for GET requests') {
            // Ignorer cette erreur spécifique pour les requêtes GET
            return next();
        }
        next(err);
    });
};

// Middleware JWT - Gère l'authentification des requêtes avec des tokens JWT
function initJwtMiddleware(app) {
    /*
    Middleware JWT : Vérifie le token JWT sur chaque requête, sauf pour les chemins spécifiés dans `unless`.
    - secret : Clé secrète utilisée pour signer les tokens.
    - algorithms : Algorithmes utilisés pour la signature.
    - unless : Exclut les chemins spécifiques de la vérification JWT.
    */
    app.use(
        jwt({
            secret: process.env.JWT_SECRET,
            algorithms: ['HS256'],
            onExpired: async (req, err) => {
                if (new Date() - err.inner.expiredAt < 5000) { return;}
                throw err;
            },
            }).unless({
            path: ['/login','/checkToken','/status','/login/google','/api-docs',/\/upload*/],
        }),

    );
}

const initFileUploadMiddleware = (app) => {
    app.use('/uploads', express.static('uploads'));
}

const initCorsMiddleware = (app) => {
    const corsOptions = {
        origin: [
            'http://localhost:3000',
            'http://localhost:3004',
            'http://localhost:3011',
            'http://localhost:8081',
            'https://dev.blinker.eterny.fr',
            'https://app.dev.blinker.eterny.fr'
        ],
    };

    app.use(cors(corsOptions));
    console.log("CORS activé");
}

const staticMiddleware = (app) => {
    app.use(express.static(__dirname + "/../../public")); // Servir des fichiers statiques
}

const initLoggerMiddleware = (app) => {
    app.use((req, res, next) => {
        const begin = new DateTime(new Date());

        res.on('finish', () => {
            const requestDate = begin.toFormat('dd/MM/yyyy HH:mm:ss.SSS');
            const remoteIP = `IP: ${req.socket.remoteAddress}`;
            const urlInfo = `${req.baseUrl}${req.path}`;
            const method = `${req.method}`;

            const end = new DateTime(new Date());
            const requestDurationMs = end.diff(begin).toMillis();
            const requestDuration = `Duration: ${requestDurationMs}ms`;

            process.stdout.write(`\x1b[36m[${requestDate}] - \x1b[0m`);
            process.stdout.write(`\x1b[35m[${remoteIP}] - \x1b[0m`);
            switch (method) {
                case "GET": process.stdout.write(`\x1b[92m[${method}] - \x1b[0m`); break;
                case "POST": process.stdout.write(`\x1b[93m[${method}] - \x1b[0m`); break;
                case "PUT": process.stdout.write(`\x1b[94m[${method}] - \x1b[0m`); break;
                case "DELETE": process.stdout.write(`\x1b[91m[${method}] - \x1b[0m`); break;
            }
            process.stdout.write(`\x1b[97m[${urlInfo}] - \x1b[0m`);
            console.log(`\x1b[36m[${requestDuration}]\x1b[0m`);
        });
        next();
    });
};

// Utilise l'implémentation de swagger.js
const initSwaggerMiddleware = (app) => {
    try {
        initializeSwagger(app);
    } catch (error) {
        console.error("❌ Error loading Swagger:", error.message);
    }
}

exports.initializeConfigMiddlewares = (app) => {
    initSwaggerMiddleware(app) // Middleware de la génération de docs
    initCorsMiddleware(app); // Initialisation du middleware CORS
    initJsonHandlerMiddleware(app); // Gestion des requêtes JSON
    handleJsonErrors(app); // Gestion des erreurs de parsing JSON
    initJwtMiddleware(app); // Middleware JWT pour l'authentification
    // initLoggerMiddleware(app); // Logger des requêtes (désactivé car remplacé par Winston)
    staticMiddleware(app); // Fichiers statiques
    initFileUploadMiddleware(app); // Middleware d'upload de fichiers
}
