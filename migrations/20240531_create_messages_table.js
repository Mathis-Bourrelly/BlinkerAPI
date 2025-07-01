const { sequelize } = require('../src/core/postgres');
const { DataTypes } = require('sequelize');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        // Vérifier si la table Messages existe déjà
        const tableExists = await sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'Messages';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Créer la table Messages si elle n'existe pas
        if (tableExists.length === 0) {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "Messages" (
                    "messageID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "senderID" UUID NOT NULL,
                    "receiverID" UUID NOT NULL,
                    "content" TEXT NOT NULL,
                    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                    "isRead" BOOLEAN DEFAULT FALSE,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    FOREIGN KEY ("senderID") REFERENCES "Users"("userID") ON DELETE CASCADE,
                    FOREIGN KEY ("receiverID") REFERENCES "Users"("userID") ON DELETE CASCADE
                );
            `, { transaction });
            
            console.log('Table Messages créée avec succès');
        } else {
            console.log('La table Messages existe déjà');
        }

        await transaction.commit();
        console.log('Migration completed successfully');
    } catch (error) {
        await transaction.rollback();
        console.error('Migration failed:', error);
        throw error;
    }
}

async function down() {
    const transaction = await sequelize.transaction();

    try {
        // Supprimer la table Messages
        await sequelize.query(`
            DROP TABLE IF EXISTS "Messages";
        `, { transaction });

        await transaction.commit();
        console.log('Rollback completed successfully');
    } catch (error) {
        await transaction.rollback();
        console.error('Rollback failed:', error);
        throw error;
    }
}

module.exports = { up, down };
