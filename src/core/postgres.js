const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialisation de Sequelize avec les options de connexion
exports.sequelize = new Sequelize({
    dialect: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    define: {
        freezeTableName: true, // Empêche Sequelize de modifier les noms de table
    },
    ssl: false,
    logging: console.log, // Pour afficher les logs SQL (facultatif)
    dialectOptions: {
        clientMinMessages: 'notice',
    }
});

// Importer les modèles
const modelDefiners = [
    require('../models/users'),
    require('../models/profiles'),
    require('../models/follows'),
    require('../models/blinks'),
    require('../models/blinkContents'),
    require('../models/interactions'),
];

(async () => {
    try {
        // Synchronisation des modèles
        for (const modelDefiner of modelDefiners) {
            if (modelDefiner && typeof modelDefiner.sync === 'function') {
                console.log(`Synchronisation du modèle : ${modelDefiner.name || 'Inconnu'}`);
                await modelDefiner.sync();
            } else {
                console.warn('Un modèle est invalide ou mal importé.');
            }
        }

        // Définition des associations après la synchronisation des modèles
        require('../models/associations'); // Importer le fichier des associations

        // Synchronisation globale de la base avec `alter` pour ajuster les tables existantes
        await exports.sequelize.sync();
        console.log('Base de données synchronisée avec succès !');
        console.log('http://localhost:3011/api-docs');
    } catch (error) {
        console.error('Erreur de synchronisation des modèles :', error);
    }
})();
