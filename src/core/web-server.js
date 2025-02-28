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
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`App listening on port ${this.port}`);
        });
    }

    _initializeRoutes() {
        this.app.use("/", loginRoute.initializeRoutes());

// Appliquer l'authentification à toutes les routes suivantes
        this.app.use(authMiddleware.verifyToken);

// Routes nécessitant une authentification
        this.app.use("/users", usersRoute.initializeRoutes());
        this.app.use("/follows", followsRoute.initializeRoutes());
        this.app.use("/profiles", profilesRoute.initializeRoutes());
        this.app.use("/blinks", blinksRoute.initializeRoutes());
        this.app.use("/interactions", interactionsRoute.initializeRoutes());
    }
}

module.exports = WebServer;
