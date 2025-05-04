require('dotenv').config();
const migration = require('./20240601_add_conversations');

async function runMigration() {
    try {
        console.log('Starting migration...');
        await migration.up();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

runMigration();
