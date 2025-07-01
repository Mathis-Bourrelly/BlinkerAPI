const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/core/postgres');

// Fonction pour exécuter une migration
async function runMigration(migrationPath) {
    try {
        const migration = require(path.resolve(migrationPath));
        
        if (typeof migration.up === 'function') {
            console.log(`Exécution de la migration: ${path.basename(migrationPath)}`);
            await migration.up();
            console.log(`Migration ${path.basename(migrationPath)} exécutée avec succès`);
        } else {
            console.warn(`La migration ${path.basename(migrationPath)} n'a pas de méthode 'up'`);
        }
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la migration ${path.basename(migrationPath)}:`, error);
        throw error;
    }
}

// Fonction principale pour exécuter toutes les migrations
async function runMigrations() {
    try {
        // Chemin du dossier des migrations
        const migrationsDir = path.join(__dirname, '../migrations');
        
        // Lire tous les fichiers de migration
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.js'))
            .sort(); // Trier par ordre alphabétique
        
        console.log(`${migrationFiles.length} migrations trouvées`);
        
        // Exécuter chaque migration
        for (const file of migrationFiles) {
            const migrationPath = path.join(migrationsDir, file);
            await runMigration(migrationPath);
        }
        
        console.log('Toutes les migrations ont été exécutées avec succès');
        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de l\'exécution des migrations:', error);
        process.exit(1);
    }
}

// Exécuter les migrations
runMigrations();
