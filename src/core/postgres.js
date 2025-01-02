const { Sequelize } = require('sequelize');
require('dotenv').config();

exports.sequelize = new Sequelize({
    dialect: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    logging: console.log, // Pour afficher les logs SQL (facultatif)
    ssl: true, // Assurez-vous que votre DB supporte SSL si nécessaire
    clientMinMessages: 'notice',
});

// Importer les modèles
const modelDefiners = [
    require('../model/users'),
];

// Initialiser les modèles
for (const modelDefiner of modelDefiners) {
    modelDefiner(exports.sequelize); // Appeler la fonction avec l'instance Sequelize
}

// Synchroniser la base de données
exports.sequelize.sync({ alter: true }) // Utiliser alter pour mettre à jour automatiquement
    .then(() => console.log('Base de données synchronisée !'))
    .catch((error) => console.error('Erreur de synchronisation :', error));
