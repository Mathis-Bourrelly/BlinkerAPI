const express = require("express");
require("dotenv").config();
const { initializeConfigMiddlewares } = require("./middlewares");
const authMiddleware = require("./middlewares/authMiddleware");
const usersRoute = require("../route/users.route");
const followsRoute = require("../route/follows.route");
const profilesRoute = require("../route/profiles.route");
const loginRoute = require("../route/login.route");
const blinksRoute = require("../route/blinks.route");
const messagesRoute = require("../route/messages.route");
const conversationsRoute = require("../route/conversations.route");
const interactionsRoute = require("../route/interactions.route");
const { sequelize } = require("./postgres");
const { AUTO_DELETE_INTERVAL } = require("../../config/blinks.config");
require("../../src/core/cron");
const SocketManager = require("./socket");
const http = require("http");

class WebServer {
    app = undefined;
    port = 3011;
    server = undefined;

    constructor() {
        this.app = express();
        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        this._initializeErrorHandler();
    }

    start() {
        this.server = http.createServer(this.app);

        // Démarrer le serveur HTTP + WebSocket
        this.server.listen(this.port, () => {
            console.log(`✅ App listening on port ${this.port}`);
            console.log(`⏳ Suppression automatique des Blinks activée toutes les ${AUTO_DELETE_INTERVAL / 1000} secondes.`);
        });

        SocketManager.initialize(this.server);
    }

    _initializeRoutes() {
        console.log("🚀 Initialisation des routes...");

        this.app.use("/", loginRoute.initializeRoutes());
        console.log("✅ Route login initialisée");

        this.app.use("/users", usersRoute.initializeRoutes());
        this.app.use("/follows", followsRoute.initializeRoutes());
        this.app.use("/profiles", profilesRoute.initializeRoutes());
        this.app.use("/blinks", blinksRoute.initializeRoutes());
        this.app.use("/messages", messagesRoute.initializeRoutes());
        this.app.use("/conversations", conversationsRoute.initializeRoutes());
        this.app.use("/interactions", interactionsRoute.initializeRoutes());

        console.log("✅ Routes protégées initialisées");
    }

    _initializeErrorHandler() {
        this.app.use((err, req, res, next) => {
            if (err.name === "UnauthorizedError") {
                res.status(401).send("invalid token");
            }
            console.error("❌ ErrorHandler :", err);
            console.error("❌ ErrorHandler :", err.message);
            const statusCode = err.statusCode || 500;
            const errorResponse = {
                message: err.message || "Erreur interne du serveur"
            };
            res.status(statusCode).json(errorResponse);
        });
    }
}

module.exports = WebServer;