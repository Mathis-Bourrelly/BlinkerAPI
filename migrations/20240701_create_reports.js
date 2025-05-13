const { sequelize } = require('../src/core/postgres');
const { DataTypes } = require('sequelize');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        // Activer l'extension UUID si elle n'est pas déjà activée
        await sequelize.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `, { transaction });

        // Vérifier si la table Reports existe déjà
        const tableExists = await sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'Reports';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Créer la table Reports si elle n'existe pas
        if (tableExists.length === 0) {
            // Créer le type ENUM pour les raisons de signalement
            await sequelize.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_reports_reason') THEN
                        CREATE TYPE "enum_reports_reason" AS ENUM ('inappropriate', 'spam', 'harassment', 'violence', 'other');
                    END IF;
                END
                $$;
            `, { transaction });

            // Créer le type ENUM pour le statut du signalement
            await sequelize.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_reports_status') THEN
                        CREATE TYPE "enum_reports_status" AS ENUM ('pending', 'reviewed', 'rejected', 'action_taken');
                    END IF;
                END
                $$;
            `, { transaction });

            // Créer la table Reports
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "Reports" (
                    "reportID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "reporterID" UUID NOT NULL REFERENCES "Users"("userID") ON DELETE CASCADE,
                    "blinkID" UUID NOT NULL REFERENCES "Blinks"("blinkID") ON DELETE CASCADE,
                    "reason" "enum_reports_reason" NOT NULL,
                    "description" TEXT,
                    "status" "enum_reports_status" NOT NULL DEFAULT 'pending',
                    "reviewedBy" UUID REFERENCES "Users"("userID"),
                    "reviewedAt" TIMESTAMP WITH TIME ZONE,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `, { transaction });

            // Créer un index sur le statut pour faciliter les requêtes de filtrage
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "Reports"("status");
            `, { transaction });

            // Créer un index sur la date de création pour faciliter le tri
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS "idx_reports_created_at" ON "Reports"("createdAt");
            `, { transaction });
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
        // Supprimer la table Reports
        await sequelize.query(`
            DROP TABLE IF EXISTS "Reports";
        `, { transaction });

        // Supprimer les types ENUM
        await sequelize.query(`
            DROP TYPE IF EXISTS "enum_reports_reason";
            DROP TYPE IF EXISTS "enum_reports_status";
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
