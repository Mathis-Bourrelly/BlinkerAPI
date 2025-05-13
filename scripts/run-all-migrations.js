require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/core/postgres');

// Liste des migrations à exécuter dans l'ordre
const migrations = [
    '20240531_create_messages_table.js',
    '20240601_add_conversations.js',
    '20240612_add_deleted_at_to_blinks.js',
    '20240612_add_sender_to_messages.js',
    '20240701_create_reports.js',
    '20240702_add_admin_users.js'
];

// Fonction pour exécuter une migration
async function runMigration(migrationFile) {
    try {
        console.log(`Exécution de la migration: ${migrationFile}`);
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

// Fonction principale pour exécuter toutes les migrations
async function runAllMigrations() {
    console.log('Démarrage de l\'exécution de toutes les migrations...');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const migrationFile of migrations) {
        const success = await runMigration(migrationFile);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    console.log(`\nRésumé des migrations:`);
    console.log(`- ${successCount} migrations exécutées avec succès`);
    console.log(`- ${failCount} migrations échouées`);
    
    if (failCount > 0) {
        console.log('\nCertaines migrations ont échoué. Vérifiez les erreurs ci-dessus.');
        process.exit(1);
    } else {
        console.log('\nToutes les migrations ont été exécutées avec succès!');
        process.exit(0);
    }
}

// Exécuter les migrations
runAllMigrations().catch(error => {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
});
