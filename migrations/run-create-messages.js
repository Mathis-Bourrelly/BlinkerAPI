require('dotenv').config();
const migration = require('./20240531_create_messages_table');

async function runMigration() {
    try {
        console.log('Starting migration to create Messages table...');
        await migration.up();
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

runMigration();
