const express = require('express');
const fileUpload = require('express-fileupload');
const { DateTime } = require('luxon');
let cors = require('cors');
// var { expressjwt: jwt } = require("express-jwt"); // Import du JWT

const initJsonHandlerMiddleware = (app) => app.use(express.json());

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
            secret: process.env.MOTDEPASSEAPP,
            algorithms: ['HS256'],
        }).unless({
            path: [
                '/login','/auth','/status','/users'
            ],
        }),
    );
}

const initFileUploadMiddleware = (app) => {
    app.use(
        fileUpload({
            limits: {
                fileSize: 10000000, // Limite de taille de fichier (10 Mo)
            },
            abortOnLimit: true, // Annule les uploads si la limite est atteinte
        })
    );
}

const initCorsMiddleware = (app) => {
    const corsOptions = {
        origin: ['http://localhost:3000','http://localhost:3004','http://localhost:3011','http://localhost:8081'],
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

exports.initializeConfigMiddlewares = (app) => {
    initCorsMiddleware(app); // Initialisation du middleware CORS
    initJsonHandlerMiddleware(app); // Gestion des requêtes JSON
    //initJwtMiddleware(app); // Middleware JWT pour l'authentification
    initLoggerMiddleware(app); // Logger des requêtes
    staticMiddleware(app); // Fichiers statiques
    initFileUploadMiddleware(app); // Middleware d'upload de fichiers
}

exports.initializeErrorMiddlewares = (app) => {
    // Gestion globale des erreurs
    app.use((err, req, res, next) => {
        res.status(500).send(err.message);
    });
}
