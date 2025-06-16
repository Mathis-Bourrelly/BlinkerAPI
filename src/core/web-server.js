const express = require("express");
require("dotenv").config();
const { initializeConfigMiddlewares } = require("./middlewares");
const authMiddleware = require("./middlewares/authMiddleware");

// Routes standardisées
const loginRouteStd = require("../route/login.route.standardized");
const usersRouteStd = require("../route/users.route.standardized");
const followsRouteStd = require("../route/follows.route.standardized");
const profilesRouteStd = require("../route/profiles.route.standardized");
const blinksRouteStd = require("../route/blinks.route.standardized");
const messagesRouteStd = require("../route/messages.route.standardized");
const conversationsRouteStd = require("../route/conversations.route.standardized");
const interactionsRouteStd = require("../route/interactions.route.standardized");
const reportsRouteStd = require("../route/reports.route.standardized");
const commentsRouteStd = require("../route/comments.route.standardized");
const tagsRoute = require("../route/tags.route");

const { sequelize } = require("./postgres");
const { AUTO_DELETE_INTERVAL } = require("../../config/blinks.config");
require("../../src/core/cron");
const SocketManager = require("./socket");
const http = require("http");
const { logger, httpLogger } = require("../utils/logger.utils");
const { errorHandler } = require("../utils/response.utils");
const { initializeSwagger } = require("./swagger");

class WebServer {
    app = undefined;
    port = 3011;
    server = undefined;

    constructor() {
        this.app = express();

        // Ajouter le middleware de journalisation HTTP
        this.app.use(httpLogger);

        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        this._initializeErrorHandler();

        logger.info('Application initialisée');
    }

    start() {
        this.server = http.createServer(this.app);

        // Démarrer le serveur HTTP + WebSocket
        this.server.listen(this.port, () => {
            logger.info(`App listening on port ${this.port}`);
            logger.info(`Suppression automatique des Blinks activée toutes les ${AUTO_DELETE_INTERVAL / 1000} secondes.`);
        });

        SocketManager.initialize(this.server);
    }

    _initializeRoutes() {
        logger.info("Initialisation des routes...");

        // Route de login standardisée
        this.app.use("/", loginRouteStd.initializeRoutes());
        logger.info("Route login initialisée");

        // Utiliser les routes standardisées avec les mêmes chemins que les routes originales
        this.app.use("/users", usersRouteStd.initializeRoutes());
        this.app.use("/follows", followsRouteStd.initializeRoutes());
        this.app.use("/profiles", profilesRouteStd.initializeRoutes());
        this.app.use("/blinks", blinksRouteStd.initializeRoutes());
        this.app.use("/messages", messagesRouteStd.initializeRoutes());
        this.app.use("/conversations", conversationsRouteStd.initializeRoutes());
        this.app.use("/interactions", interactionsRouteStd.initializeRoutes());
        this.app.use("/reports", reportsRouteStd.initializeRoutes());
        this.app.use("/comments", commentsRouteStd);
        this.app.use("/tags", tagsRoute);

        logger.info("Routes standardisées initialisées");

        // Note: Les routes originales sont toujours disponibles dans le code mais ne sont plus utilisées
        // Elles peuvent être réactivées en cas de besoin pour la rétro-compatibilité
    }

    _initializeErrorHandler() {
        // Utiliser le middleware de gestion d'erreurs standardisé
        this.app.use((err, req, res, next) => {
            if (err.name === "UnauthorizedError") {
                logger.error(`Accès non autorisé: ${err.message}`);
                return res.status(401).send("invalid token");
            }
            next(err);
        });

        // Utiliser notre gestionnaire d'erreurs standardisé
        this.app.use(errorHandler);
    }
}

module.exports = WebServer;