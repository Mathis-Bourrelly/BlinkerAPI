const express = require('express');
const {initializeConfigMiddlewares, initializeErrorMiddlewares} = require('./middlewares');
const usersRoute = require('../route/users.route');
const loginRoute = require('../route/login.route');

const {sequelize} = require('./postgres');

class WebServer {
    app = undefined;
    port = 3000;
    server = undefined;


    constructor() {
        this.app = express();
        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        initializeErrorMiddlewares(this.app);
        sequelize.sync()
    }

    start() {
    this.server = this.app.listen(this.port, () => {
            console.log(`app listening on port ${this.port}`);
        });
    }

    stop() {
        this.server.close();
    }

    _initializeRoutes() {
        this.app.use('/users', usersRoute.initializeRoutes());
        this.app.use('/', loginRoute.initializeRoutes());
    }
}

module.exports = WebServer;
