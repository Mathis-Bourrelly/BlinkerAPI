const express = require('express');
const { DateTime } = require('luxon');
let cors = require('cors');
const swaggerUi = require('swagger-ui-express')
const {expressjwt: jwt} = require("express-jwt");
const yaml = require("js-yaml");
const fs = require("fs");


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

const initSwaggerMiddleware = (app) => {
    try {
        console.log("Loading Swagger documentation...");
        
        // Charger le document principal
        const swaggerDocument = yaml.load(fs.readFileSync("./docs/swagger/index.yaml", "utf8"));
        
        // Charger les composants
        const securitySchemes = yaml.load(fs.readFileSync("./docs/swagger/components/security.yaml", "utf8"));
        const schemas = yaml.load(fs.readFileSync("./docs/swagger/schemas/index.yaml", "utf8"));
        
        // Charger les chemins
        const blinksPaths = yaml.load(fs.readFileSync("./docs/swagger/paths/blinks.yaml", "utf8"));
        const interactionsPaths = yaml.load(fs.readFileSync("./docs/swagger/paths/interactions.yaml", "utf8"));
        const profilesPaths = yaml.load(fs.readFileSync("./docs/swagger/paths/profiles.yaml", "utf8"));
        const followsPaths = yaml.load(fs.readFileSync("./docs/swagger/paths/follows.yaml", "utf8"));
        const authPaths = yaml.load(fs.readFileSync("./docs/swagger/paths/auth.yaml", "utf8"));
        const usersPaths = yaml.load(fs.readFileSync("./docs/swagger/paths/users.yaml", "utf8"));
        
        // Combiner tous les chemins
        const paths = {
            ...blinksPaths.paths,
            ...interactionsPaths.paths,
            ...profilesPaths.paths,
            ...followsPaths.paths,
            ...authPaths.paths,
            ...usersPaths.paths
        };
        
        // Mettre à jour le document Swagger
        swaggerDocument.paths = paths;
        swaggerDocument.components = {
            securitySchemes: securitySchemes.components.securitySchemes,
            schemas: schemas.components.schemas
        };
        
        // Configurer Swagger UI avec les options
        const options = {
            explorer: true,
            swaggerOptions: {
                docExpansion: "list",
                filter: true,
                showRequestDuration: true,
                tryItOutEnabled: true,
                requestInterceptor: (req) => {
                    // Ajouter le token JWT si disponible
                    const token = localStorage.getItem('token');
                    if (token) {
                        req.headers.Authorization = `Bearer ${token}`;
                    }
                    return req;
                }
            }
        };
        
        // Servir le document Swagger
        app.use("/api-docs", swaggerUi.serve);
        app.get("/api-docs/swagger.json", (req, res) => {
            res.json(swaggerDocument);
        });
        app.use("/api-docs", swaggerUi.setup(swaggerDocument, options));
        
        console.log("✅ Swagger initialized at /api-docs");
    } catch (error) {
        console.error("❌ Error loading Swagger:", error.message);
    }
}

exports.initializeConfigMiddlewares = (app) => {
    initSwaggerMiddleware(app) // Middleware de la génération de docs
    initCorsMiddleware(app); // Initialisation du middleware CORS
    initJsonHandlerMiddleware(app); // Gestion des requêtes JSON
    initJwtMiddleware(app); // Middleware JWT pour l'authentification
    initLoggerMiddleware(app); // Logger des requêtes
    staticMiddleware(app); // Fichiers statiques
    initFileUploadMiddleware(app); // Middleware d'upload de fichiers
}
