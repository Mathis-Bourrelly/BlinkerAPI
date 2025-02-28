const express = require("express");
const { initializeConfigMiddlewares } = require("./middlewares");
const authMiddleware = require("./middlewares/authMiddleware");
const usersRoute = require("../route/users.route");
const followsRoute = require("../route/follows.route");
const profilesRoute = require("../route/profiles.route");
const loginRoute = require("../route/login.route");
const blinksRoute = require("../route/blinks.route");
const interactionsRoute = require("../route/interactions.route");
const { sequelize } = require("./postgres");

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
        this.server = this.app.listen(this.port, () => {
            console.log(`✅ App listening on port ${this.port}`);
        });
    }

    _initializeRoutes() {
        console.log("🚀 Initialisation des routes...");

        this.app.use("/", loginRoute.initializeRoutes());
        console.log("✅ Route login initialisée");

        this.app.use(authMiddleware.verifyToken);

        this.app.use("/users", usersRoute.initializeRoutes());
        this.app.use("/follows", followsRoute.initializeRoutes());
        this.app.use("/profiles", profilesRoute.initializeRoutes());
        this.app.use("/blinks", blinksRoute.initializeRoutes());
        this.app.use("/interactions", interactionsRoute.initializeRoutes());

        console.log("✅ Routes protégées initialisées");
    }

    _initializeErrorHandler() {
        this.app.use((err, req, res, next) => {
            console.error("❌ Erreur interceptée :", err);

            const statusCode = err.statusCode || 500;
            res.status(statusCode).json({
                error: err.message || "Erreur interne du serveur"
            });
        });
    }
}

module.exports = WebServer;
