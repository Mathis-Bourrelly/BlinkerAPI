const express = require('express');
const { initializeConfigMiddlewares, initializeErrorMiddlewares } = require('./middlewares');
const usersRoute = require('../route/users.route');
const loginRoute = require('../route/login.route');
const { sequelize } = require('./postgres');

class WebServer {
    app = undefined;
    port = process.env.PORT || 3000;
    server = undefined;

    constructor() {
        this.app = express();
        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        initializeErrorMiddlewares(this.app);
        this._initializeDatabase();
    }

    async _initializeDatabase() {
        try {
            await sequelize.sync();
            console.log('Database synchronized successfully');
        } catch (error) {
            console.error('Error synchronizing database:', error);
            process.exit(1);
        }
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`App listening on port ${this.port}`);
        });
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('Server stopped');
            });
        } else {
            console.warn('Server is not running');
        }
    }

    _initializeRoutes() {
        console.log('Initializing routes...');
        this.app.use('/users', usersRoute.initializeRoutes());
        console.log('/users route initialized');
        this.app.use('/', loginRoute.initializeRoutes());
        console.log('Root login route initialized');
    }
}

module.exports = WebServer;
