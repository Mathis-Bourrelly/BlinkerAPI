const { Sequelize } = require('sequelize');
require('dotenv').config();
const { PostgresDialect } = require("@sequelize/postgres");

exports.sequelize = new Sequelize({
    dialect: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    ssl: true,
    clientMinMessages: 'notice',
});

const modelDefiners = [
    require('../model/users'),
];

for (const modelDefiner of modelDefiners) {
    modelDefiner.sync();
}



