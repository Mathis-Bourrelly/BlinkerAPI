const { sequelize } = require('../src/core/postgres');
const { DataTypes } = require('sequelize');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        // Vérifier si la table Conversations existe déjà
        const tableExists = await sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'Conversations';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // 1. Créer la table Conversations si elle n'existe pas
        if (tableExists.length === 0) {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "Conversations" (
                    "conversationID" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "participants" UUID[] NOT NULL,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `, { transaction });
        }

        // Vérifier si la table Messages existe (vérifier avec et sans casse)
        const messagesTableExists = await sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND (table_name = 'Messages' OR table_name = 'messages');
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Si la table Messages n'existe pas, on ne peut pas continuer avec les modifications
        if (messagesTableExists.length === 0) {
            console.log('La table Messages n\'existe pas encore, création de la table Messages ignorée');
        } else {
            // 2. Vérifier si la colonne conversationID existe déjà (vérifier avec et sans casse)
            const conversationIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages') AND column_name = 'conversationID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            // Ajouter la colonne conversationID si elle n'existe pas
            if (conversationIDExists.length === 0) {
                await sequelize.query(`
                    ALTER TABLE IF EXISTS "Messages"
                    ADD COLUMN "conversationID" UUID;

                    ALTER TABLE IF EXISTS "messages"
                    ADD COLUMN "conversationID" UUID;
                `, { transaction });
            }
        }

        // Ne vérifier les colonnes que si la table Messages existe
        if (messagesTableExists.length > 0) {
            // Vérifier si les colonnes receiverID et senderID existent (vérifier avec et sans casse)
            const receiverIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages') AND column_name = 'receiverID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            const senderIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages') AND column_name = 'senderID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            // 3. Créer des conversations pour les messages existants seulement si les colonnes senderID et receiverID existent
            if (senderIDExists.length > 0 && receiverIDExists.length > 0) {
            // Vérifier s'il y a des messages sans conversationID (essayer les deux casses)
            let messagesWithoutConversation;
            try {
                messagesWithoutConversation = await sequelize.query(`
                    SELECT COUNT(*) as count
                    FROM "Messages"
                    WHERE "conversationID" IS NULL;
                `, { type: sequelize.QueryTypes.SELECT, transaction });
            } catch (error) {
                // Si la requête échoue avec Messages, essayer avec messages
                try {
                    messagesWithoutConversation = await sequelize.query(`
                        SELECT COUNT(*) as count
                        FROM "messages"
                        WHERE "conversationID" IS NULL;
                    `, { type: sequelize.QueryTypes.SELECT, transaction });
                } catch (innerError) {
                    // Si les deux échouent, définir un tableau vide
                    messagesWithoutConversation = [{ count: '0' }];
                }
            }

            if (parseInt(messagesWithoutConversation[0].count) > 0) {
                let messages;
                try {
                    messages = await sequelize.query(`
                        SELECT DISTINCT
                            CASE
                                WHEN "senderID" < "receiverID" THEN "senderID" || ',' || "receiverID"
                                ELSE "receiverID" || ',' || "senderID"
                            END as participant_pair,
                            ARRAY["senderID", "receiverID"] as participants
                        FROM "Messages"
                        WHERE "conversationID" IS NULL;
                    `, { type: sequelize.QueryTypes.SELECT, transaction });
                } catch (error) {
                    // Si la requête échoue avec Messages, essayer avec messages
                    try {
                        messages = await sequelize.query(`
                            SELECT DISTINCT
                                CASE
                                    WHEN "senderID" < "receiverID" THEN "senderID" || ',' || "receiverID"
                                    ELSE "receiverID" || ',' || "senderID"
                                END as participant_pair,
                                ARRAY["senderID", "receiverID"] as participants
                            FROM "messages"
                            WHERE "conversationID" IS NULL;
                        `, { type: sequelize.QueryTypes.SELECT, transaction });
                    } catch (innerError) {
                        // Si les deux échouent, définir un tableau vide
                        messages = [];
                    }
                }

                // Créer les conversations
                for (const message of messages) {
                    const [conversation] = await sequelize.query(`
                        INSERT INTO "Conversations" ("participants")
                        VALUES (:participants)
                        RETURNING "conversationID";
                    `, {
                        replacements: { participants: message.participants },
                        type: sequelize.QueryTypes.INSERT,
                        transaction
                    });

                    const conversationID = conversation[0].conversationID;

                    // Mettre à jour les messages correspondants
                    await sequelize.query(`
                        UPDATE "Messages"
                        SET "conversationID" = :conversationID
                        WHERE ("senderID" = :participant1 AND "receiverID" = :participant2)
                           OR ("senderID" = :participant2 AND "receiverID" = :participant1);

                        -- Essayer aussi avec la table en minuscules
                        UPDATE "messages"
                        SET "conversationID" = :conversationID
                        WHERE ("senderID" = :participant1 AND "receiverID" = :participant2)
                           OR ("senderID" = :participant2 AND "receiverID" = :participant1);
                    `, {
                        replacements: {
                            conversationID,
                            participant1: message.participants[0],
                            participant2: message.participants[1]
                        },
                        transaction
                    });
                }
            }
        }
        }

        // Ne continuer que si la table Messages existe
        if (messagesTableExists.length > 0) {
            // 4. Vérifier si la colonne conversationID est déjà NOT NULL (vérifier avec et sans casse)
            const isNotNull = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages')
                AND column_name = 'conversationID'
                AND is_nullable = 'NO';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            // Vérifier si la colonne conversationID existe (vérifier avec et sans casse)
            const conversationIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages') AND column_name = 'conversationID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            // Rendre la colonne conversationID NOT NULL si elle ne l'est pas déjà
            if (isNotNull.length === 0 && conversationIDExists.length > 0) {
                await sequelize.query(`
                    ALTER TABLE IF EXISTS "Messages"
                    ALTER COLUMN "conversationID" SET NOT NULL;

                    ALTER TABLE IF EXISTS "messages"
                    ALTER COLUMN "conversationID" SET NOT NULL;
                `, { transaction });
            }

            // Vérifier si la contrainte existe déjà (essayer les deux casses)
            let constraintExists = [];
            try {
                const result = await sequelize.query(`
                    SELECT 1 FROM pg_constraint c
                    JOIN pg_class t ON c.conrelid = t.oid
                    WHERE c.conname = 'Messages_conversationID_fkey'
                    AND t.relname IN ('Messages', 'messages');
                `, { type: sequelize.QueryTypes.SELECT, transaction });
                constraintExists = result;
            } catch (error) {
                // Ignorer l'erreur et continuer
                console.log('Erreur lors de la vérification de la contrainte:', error.message);
            }

            if (constraintExists.length === 0 && conversationIDExists.length > 0) {
                await sequelize.query(`
                    -- Essayer d'ajouter la contrainte sur les deux tables possibles
                    ALTER TABLE IF EXISTS "Messages"
                    ADD CONSTRAINT IF NOT EXISTS "Messages_conversationID_fkey"
                    FOREIGN KEY ("conversationID")
                    REFERENCES "Conversations"("conversationID")
                    ON DELETE CASCADE;

                    ALTER TABLE IF EXISTS "messages"
                    ADD CONSTRAINT IF NOT EXISTS "messages_conversationID_fkey"
                    FOREIGN KEY ("conversationID")
                    REFERENCES "Conversations"("conversationID")
                    ON DELETE CASCADE;
                `, { transaction });
            }

            // Vérifier si les colonnes receiverID et senderID existent (vérifier avec et sans casse)
            const receiverIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages') AND column_name = 'receiverID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            const senderIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE (table_name = 'Messages' OR table_name = 'messages') AND column_name = 'senderID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            // 5. Supprimer les colonnes receiverID et senderID si elles existent
            if (receiverIDExists.length > 0) {
                await sequelize.query(`
                    ALTER TABLE IF EXISTS "Messages"
                    DROP COLUMN IF EXISTS "receiverID";

                    ALTER TABLE IF EXISTS "messages"
                    DROP COLUMN IF EXISTS "receiverID";
                `, { transaction });
            }

            if (senderIDExists.length > 0) {
                await sequelize.query(`
                    ALTER TABLE IF EXISTS "Messages"
                    DROP COLUMN IF EXISTS "senderID";

                    ALTER TABLE IF EXISTS "messages"
                    DROP COLUMN IF EXISTS "senderID";
                `, { transaction });
            }
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
        // Vérifier si la table Conversations existe
        const conversationsExist = await sequelize.query(`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'Conversations';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        if (conversationsExist.length === 0) {
            console.log('La table Conversations n\'existe pas, rien à faire');
            await transaction.commit();
            return;
        }

        // Vérifier si la colonne conversationID existe dans Messages
        const conversationIDExists = await sequelize.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'Messages' AND column_name = 'conversationID';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        if (conversationIDExists.length > 0) {
            // 1. Supprimer la contrainte de clé étrangère
            await sequelize.query(`
                ALTER TABLE "Messages"
                DROP CONSTRAINT IF EXISTS "Messages_conversationID_fkey";
            `, { transaction });

            // 2. Vérifier si les colonnes receiverID et senderID existent déjà
            const receiverIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'Messages' AND column_name = 'receiverID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            const senderIDExists = await sequelize.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'Messages' AND column_name = 'senderID';
            `, { type: sequelize.QueryTypes.SELECT, transaction });

            // Ajouter les colonnes receiverID et senderID si elles n'existent pas
            if (receiverIDExists.length === 0 || senderIDExists.length === 0) {
                await sequelize.query(`
                    ALTER TABLE "Messages"
                    ADD COLUMN IF NOT EXISTS "receiverID" UUID,
                    ADD COLUMN IF NOT EXISTS "senderID" UUID;
                `, { transaction });

                // 3. Restaurer les valeurs de receiverID et senderID à partir des conversations
                await sequelize.query(`
                    UPDATE "Messages" m
                    SET
                        "senderID" = (SELECT participants[1] FROM "Conversations" WHERE "conversationID" = m."conversationID"),
                        "receiverID" = (SELECT participants[2] FROM "Conversations" WHERE "conversationID" = m."conversationID")
                    WHERE "senderID" IS NULL OR "receiverID" IS NULL;
                `, { transaction });

                // 4. Rendre les colonnes receiverID et senderID NOT NULL
                await sequelize.query(`
                    ALTER TABLE "Messages"
                    ALTER COLUMN "receiverID" SET NOT NULL,
                    ALTER COLUMN "senderID" SET NOT NULL;
                `, { transaction });
            }

            // 5. Supprimer la colonne conversationID
            await sequelize.query(`
                ALTER TABLE "Messages"
                DROP COLUMN IF EXISTS "conversationID";
            `, { transaction });
        }

        // 6. Supprimer la table Conversations
        await sequelize.query(`
            DROP TABLE IF EXISTS "Conversations";
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
