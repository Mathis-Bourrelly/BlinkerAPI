const { sequelize } = require('../src/core/postgres');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Début de la migration : Création du système de tags');

        // Créer la table Tags
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "Tags" (
                "tagID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" VARCHAR(50) NOT NULL UNIQUE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `, { transaction });
        
        console.log('Table Tags créée avec succès');

        // Créer la table de liaison BlinkTags
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "BlinkTags" (
                "blinkTagID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "blinkID" UUID NOT NULL,
                "tagID" UUID NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                FOREIGN KEY ("blinkID") REFERENCES "Blinks"("blinkID") ON DELETE CASCADE,
                FOREIGN KEY ("tagID") REFERENCES "Tags"("tagID") ON DELETE CASCADE,
                UNIQUE("blinkID", "tagID")
            );
        `, { transaction });
        
        console.log('Table BlinkTags créée avec succès');

        // Créer un index pour optimiser les requêtes de statistiques
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "idx_blinktags_tagid_createdat" 
            ON "BlinkTags"("tagID", "createdAt");
        `, { transaction });

        // Créer un index pour optimiser les requêtes par blink
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "idx_blinktags_blinkid" 
            ON "BlinkTags"("blinkID");
        `, { transaction });

        // Créer une fonction pour vérifier la limite de 3 tags par blink
        await sequelize.query(`
            CREATE OR REPLACE FUNCTION check_blink_tags_limit()
            RETURNS TRIGGER AS $$
            BEGIN
                IF (SELECT COUNT(*) FROM "BlinkTags" WHERE "blinkID" = NEW."blinkID") >= 3 THEN
                    RAISE EXCEPTION 'Un blink ne peut avoir que 3 tags maximum';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `, { transaction });

        // Créer le trigger pour appliquer la limite
        await sequelize.query(`
            DROP TRIGGER IF EXISTS trigger_check_blink_tags_limit ON "BlinkTags";
            CREATE TRIGGER trigger_check_blink_tags_limit
                BEFORE INSERT ON "BlinkTags"
                FOR EACH ROW
                EXECUTE FUNCTION check_blink_tags_limit();
        `, { transaction });

        console.log('Contraintes et triggers créés avec succès');

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
        console.log('Début du rollback : Suppression du système de tags');

        // Supprimer le trigger et la fonction
        await sequelize.query(`
            DROP TRIGGER IF EXISTS trigger_check_blink_tags_limit ON "BlinkTags";
        `, { transaction });

        await sequelize.query(`
            DROP FUNCTION IF EXISTS check_blink_tags_limit();
        `, { transaction });

        // Supprimer les tables
        await sequelize.query(`
            DROP TABLE IF EXISTS "BlinkTags";
        `, { transaction });

        await sequelize.query(`
            DROP TABLE IF EXISTS "Tags";
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
