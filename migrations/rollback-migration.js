require('dotenv').config();
const migration = require('./20240601_add_conversations');

async function rollbackMigration() {
    try {
        console.log('Starting rollback...');
        await migration.down();
        console.log('Rollback completed successfully');
    } catch (error) {
        console.error('Rollback failed:', error);
    } finally {
        process.exit();
    }
}

rollbackMigration();
