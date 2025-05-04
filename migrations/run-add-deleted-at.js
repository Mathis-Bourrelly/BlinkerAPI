require('dotenv').config();
const migration = require('./20240612_add_deleted_at_to_blinks');

async function runMigration() {
    try {
        console.log('Starting migration to add deletedAt to Blinks...');
        await migration.up();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

runMigration();
