const { sequelize } = require('../src/core/postgres');

async function listTables() {
    try {
        // Lister toutes les tables
        const result = await sequelize.query(
            'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_type = \'BASE TABLE\' ORDER BY table_name'
        );

        console.log('Tables dans la base de données:');
        for (const row of result[0]) {
            console.log(`- ${row.table_name}`);
        }

        // Vérifier si les tables spécifiques existent
        console.log('\nVérification des tables spécifiques:');
        const tables = ['Users', 'Profiles', 'Messages', 'Conversations', 'Blinks', 'BlinkContents', 'Reports'];

        for (const table of tables) {
            const exists = await sequelize.query(
                `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}')`,
                { type: sequelize.QueryTypes.SELECT }
            );
            console.log(`- ${table}: ${exists[0].exists ? 'Existe' : 'N\'existe pas'}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

listTables();
