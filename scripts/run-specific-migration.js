const path = require('path');
const { sequelize } = require('../src/core/postgres');

// Récupérer le nom de la migration à partir des arguments
const migrationName = process.argv[2];

if (!migrationName) {
    console.error('Veuillez spécifier le nom de la migration à exécuter');
    console.error('Exemple: node scripts/run-specific-migration.js 20240701_create_reports.js');
    process.exit(1);
}

// Fonction pour exécuter une migration
async function runMigration(migrationName) {
    try {
        const migrationPath = path.join(__dirname, '../migrations', migrationName);
        
        // Vérifier si le fichier existe
        try {
            require.resolve(migrationPath);
        } catch (error) {
            console.error(`La migration ${migrationName} n'existe pas`);
            process.exit(1);
        }
        
        const migration = require(migrationPath);
        
        if (typeof migration.up === 'function') {
            console.log(`Exécution de la migration: ${migrationName}`);
            await migration.up();
            console.log(`Migration ${migrationName} exécutée avec succès`);
        } else {
            console.warn(`La migration ${migrationName} n'a pas de méthode 'up'`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la migration ${migrationName}:`, error);
        process.exit(1);
    }
}

// Exécuter la migration spécifiée
runMigration(migrationName);
