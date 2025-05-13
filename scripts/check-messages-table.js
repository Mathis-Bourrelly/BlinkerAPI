const { sequelize } = require('../src/core/postgres');

async function checkMessagesTable() {
    try {
        const result = await sequelize.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Messages' 
            ORDER BY ordinal_position
        `);
        
        console.log('Structure de la table Messages:');
        for (const col of result[0]) {
            console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erreur:', error);
        process.exit(1);
    }
}

checkMessagesTable();
