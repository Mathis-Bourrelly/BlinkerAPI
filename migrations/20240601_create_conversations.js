const { sequelize } = require('../src/core/postgres');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        // Vérifier si la table Conversations existe déjà
        const tableExists = await sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'Conversations';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Créer la table Conversations si elle n'existe pas
        if (tableExists.length === 0) {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "Conversations" (
                    "conversationID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "participants" UUID[] NOT NULL,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `, { transaction });
            console.log('Table Conversations créée avec succès');
        } else {
            console.log('La table Conversations existe déjà');
        }

        // Vérifier si la colonne conversationID existe dans la table Messages
        const columnExists = await sequelize.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'Messages' AND column_name = 'conversationID';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Ajouter la colonne conversationID si elle n'existe pas
        if (columnExists.length === 0) {
            await sequelize.query(`
                ALTER TABLE "Messages"
                ADD COLUMN "conversationID" UUID;
            `, { transaction });
            console.log('Colonne conversationID ajoutée à la table Messages');
        } else {
            console.log('La colonne conversationID existe déjà dans la table Messages');
        }

        await transaction.commit();
        console.log('Migration terminée avec succès');
    } catch (error) {
        await transaction.rollback();
        console.error('Migration failed:', error);
        throw error;
    }
}

async function down() {
    const transaction = await sequelize.transaction();

    try {
        // Supprimer la colonne conversationID de la table Messages
        await sequelize.query(`
            ALTER TABLE "Messages"
            DROP COLUMN IF EXISTS "conversationID";
        `, { transaction });
        console.log('Colonne conversationID supprimée de la table Messages');

        // Supprimer la table Conversations
        await sequelize.query(`
            DROP TABLE IF EXISTS "Conversations";
        `, { transaction });
        console.log('Table Conversations supprimée');

        await transaction.commit();
        console.log('Rollback terminé avec succès');
    } catch (error) {
        await transaction.rollback();
        console.error('Rollback failed:', error);
        throw error;
    }
}

module.exports = { up, down };
