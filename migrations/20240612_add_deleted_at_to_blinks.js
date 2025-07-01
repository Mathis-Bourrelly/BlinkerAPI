const { sequelize } = require('../src/core/postgres');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        // Vérifier si la colonne deletedAt existe déjà
        const deletedAtExists = await sequelize.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'Blinks' AND column_name = 'deletedAt';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Ajouter la colonne deletedAt si elle n'existe pas
        if (deletedAtExists.length === 0) {
            await sequelize.query(`
                ALTER TABLE "Blinks"
                ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE;
            `, { transaction });
            
            console.log('Colonne deletedAt ajoutée à la table Blinks');
        } else {
            console.log('La colonne deletedAt existe déjà dans la table Blinks');
        }

        // Créer une table pour stocker l'historique des durées de vie des blinks
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "BlinkLifetimes" (
                "id" SERIAL PRIMARY KEY,
                "userID" UUID NOT NULL,
                "blinkID" UUID NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "deletedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "lifetime" INTEGER NOT NULL, -- durée de vie en secondes
                FOREIGN KEY ("userID") REFERENCES "Users"("userID") ON DELETE CASCADE
            );
        `, { transaction });
        
        console.log('Table BlinkLifetimes créée');

        await transaction.commit();
        console.log('Migration terminée avec succès');
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur lors de la migration:', error);
        throw error;
    }
}

async function down() {
    const transaction = await sequelize.transaction();

    try {
        // Supprimer la colonne deletedAt
        await sequelize.query(`
            ALTER TABLE "Blinks"
            DROP COLUMN IF EXISTS "deletedAt";
        `, { transaction });

        // Supprimer la table BlinkLifetimes
        await sequelize.query(`
            DROP TABLE IF EXISTS "BlinkLifetimes";
        `, { transaction });

        await transaction.commit();
        console.log('Rollback terminé avec succès');
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur lors du rollback:', error);
        throw error;
    }
}

module.exports = { up, down };
