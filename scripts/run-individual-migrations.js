require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/core/postgres');

// Fonction pour exécuter une migration spécifique
async function runMigration(migrationFile) {
    try {
        console.log(`\n=== Exécution de la migration: ${migrationFile} ===`);
        const migrationPath = path.join(__dirname, '../migrations', migrationFile);
        
        // Vérifier si le fichier existe
        if (!fs.existsSync(migrationPath)) {
            console.error(`Le fichier de migration ${migrationFile} n'existe pas`);
            return false;
        }
        
        const migration = require(migrationPath);
        
        if (typeof migration === 'function') {
            // Si la migration est une fonction (format ancien)
            await migration();
            console.log(`Migration ${migrationFile} exécutée avec succès`);
            return true;
        } else if (migration && typeof migration.up === 'function') {
            // Si la migration a une méthode up (format standard)
            await migration.up();
            console.log(`Migration ${migrationFile} exécutée avec succès`);
            return true;
        } else {
            console.warn(`La migration ${migrationFile} n'a pas de méthode 'up' ou n'est pas une fonction`);
            return false;
        }
    } catch (error) {
        console.error(`Erreur lors de l'exécution de la migration ${migrationFile}:`, error);
        return false;
    }
}

// Fonction principale
async function main() {
    // Demander quelle migration exécuter
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node scripts/run-individual-migrations.js <migration-file>');
        console.log('Exemple: node scripts/run-individual-migrations.js 20240531_create_messages_table.js');
        process.exit(1);
    }
    
    const migrationFile = args[0];
    const success = await runMigration(migrationFile);
    
    if (success) {
        console.log(`\nMigration ${migrationFile} exécutée avec succès!`);
        process.exit(0);
    } else {
        console.log(`\nÉchec de la migration ${migrationFile}.`);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
});
