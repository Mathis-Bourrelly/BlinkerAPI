const express = require("express");
const fs = require("fs");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");
const { initializeConfigMiddlewares, initializeErrorMiddlewares } = require("./middlewares");
const usersRoute = require("../route/users.route");
const followsRoute = require("../route/follows.route");
const profilesRoute = require("../route/profiles.route");
const loginRoute = require("../route/login.route");
const blinksRoute = require("../route/blinks.route");
const { sequelize } = require("./postgres");

class WebServer {
    app = undefined;
    port = 3011;
    server = undefined;

    constructor() {
        this.app = express();
        initializeConfigMiddlewares(this.app);
        this._initializeSwagger();  // Ajout de Swagger
        this._initializeRoutes();
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🚀 App listening on port ${this.port}`);
            console.log(`📄 Swagger docs available at http://localhost:${this.port}/api-docs`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log("Server stopped");
            });
        } else {
            console.warn("Server is not running");
        }
    }

        try {
            console.log("Loading Swagger documentation...");
            const swaggerFile = "./docs/swagger.yaml";
            const swaggerDocument = yaml.load(fs.readFileSync(swaggerFile, "utf8"));
            this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
            console.log("✅ Swagger initialized at /api-docs");
        } catch (error) {
            console.error("❌ Error loading Swagger:", error.message);
        }
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
    }
}

module.exports = WebServer;
