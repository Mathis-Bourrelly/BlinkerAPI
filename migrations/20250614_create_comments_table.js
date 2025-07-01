const { sequelize } = require('../src/core/postgres');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Début de la migration : Création de la table Comments');

        // Vérifier si la table Comments existe déjà
        const tableExists = await sequelize.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'Comments';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Créer la table Comments si elle n'existe pas
        if (tableExists.length === 0) {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "Comments" (
                    "commentID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "blinkID" UUID NOT NULL,
                    "userID" UUID NOT NULL,
                    "content" TEXT NOT NULL,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    FOREIGN KEY ("blinkID") REFERENCES "Blinks"("blinkID") ON DELETE CASCADE,
                    FOREIGN KEY ("userID") REFERENCES "Users"("userID") ON DELETE CASCADE,
                    UNIQUE("blinkID", "userID")
                );
            `, { transaction });
            
            console.log('Table Comments créée avec succès');
            
            // Créer un index pour optimiser les requêtes
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS "idx_comments_blink_id" ON "Comments"("blinkID");
            `, { transaction });
            
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS "idx_comments_user_id" ON "Comments"("userID");
            `, { transaction });
            
            console.log('Index créés pour la table Comments');
        } else {
            console.log('La table Comments existe déjà');
        }

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
        // Supprimer la table Comments
        await sequelize.query(`
            DROP TABLE IF EXISTS "Comments";
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
