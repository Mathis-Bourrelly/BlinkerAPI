const { Sequelize } = require('sequelize');
require('dotenv').config();
const { PostgresDialect } = require("@sequelize/postgres");

// Initialisation de Sequelize avec les options de connexion
exports.sequelize = new Sequelize({
    dialect: 'postgres',
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_PORT,
<<<<<<< Updated upstream
    ssl: true,
    clientMinMessages: 'notice',
});

=======
    logging: console.log, // Affiche les requêtes SQL dans la console pour débogage
    dialectOptions: {
        ssl: process.env.DB_SSL === 'true', // Activer SSL si nécessaire
    },
    define: {
        freezeTableName: true, // Empêche Sequelize de modifier les noms de table
    },
});

// Importation des modèles
>>>>>>> Stashed changes
const modelDefiners = [
    require('../model/users'),
    // Ajoutez ici d'autres modèles si nécessaire
];

<<<<<<< Updated upstream
for (const modelDefiner of modelDefiners) {
    modelDefiner.sync();
}



=======
// Vérification et synchronisation des modèles
(async () => {
    try {
        for (const modelDefiner of modelDefiners) {
            if (modelDefiner && typeof modelDefiner.sync === 'function') {
                console.log(`Synchronisation du modèle : ${modelDefiner.name || 'Inconnu'}`);
                await modelDefiner.sync();
            } else {
                console.warn('Un modèle est invalide ou mal importé.');
            }
        }

        // Synchronisation globale de la base avec `alter` pour ajuster les tables existantes
        await exports.sequelize.sync({ alter: true });
        console.log('Base de données synchronisée avec succès !');
    } catch (error) {
        console.error('Erreur de synchronisation des modèles :', error);
    }
})();
>>>>>>> Stashed changes
