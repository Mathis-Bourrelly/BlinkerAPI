const express = require("express");
const { initializeConfigMiddlewares } = require("./middlewares");
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
        console.log("Initializing routes...");
        this.app.use("/users", usersRoute.initializeRoutes());
        console.log("✅ users route initialized");
        this.app.use("/", loginRoute.initializeRoutes());
        console.log("✅ login route initialized");
        this.app.use("/follows", followsRoute.initializeRoutes());
        console.log("✅ follows route initialized");
        this.app.use("/profiles", profilesRoute.initializeRoutes());
        console.log("✅ profiles route initialized");
        this.app.use("/blinks", blinksRoute.initializeRoutes());
        console.log("✅ blinks route initialized");
        this.app.use("/interactions", interactionsRoute.initializeRoutes());
        console.log("✅ interactions route initialized");
    }
}

module.exports = WebServer;
