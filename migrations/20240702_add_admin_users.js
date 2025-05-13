const { sequelize } = require('../src/core/postgres');
const bcrypt = require('bcryptjs');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        // Vérifier si la colonne role existe dans la table Users
        const roleColumnExists = await sequelize.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'Users'
            AND column_name = 'role';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Si la colonne role n'existe pas, l'ajouter
        if (roleColumnExists.length === 0) {
            await sequelize.query(`
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) NOT NULL DEFAULT 'user';
            `, { transaction });
        }

        // Vérifier si l'utilisateur admin existe déjà
        const adminExists = await sequelize.query(`
            SELECT * FROM "Users"
            WHERE "email" = 'admin@blinker.com';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        // Si l'admin n'existe pas, le créer
        if (adminExists.length === 0) {
            // Générer un mot de passe hashé
            const hashedPassword = bcrypt.hashSync('admin123', 10);

            // Créer l'utilisateur admin
            const [adminUser] = await sequelize.query(`
                INSERT INTO "Users" ("userID", "email", "password", "role", "isVerified")
                VALUES (uuid_generate_v4(), 'admin@blinker.com', :password, 'admin', true)
                RETURNING "userID";
            `, { 
                replacements: { password: hashedPassword },
                type: sequelize.QueryTypes.INSERT,
                transaction
            });

            // Récupérer l'ID de l'utilisateur admin
            const adminID = adminUser[0].userID;

            // Créer le profil admin
            await sequelize.query(`
                INSERT INTO "Profiles" ("userID", "username", "display_name", "bio", "avatar_url", "score")
                VALUES (:userID, 'admin', 'Administrateur', 'Compte administrateur de la plateforme', NULL, 0);
            `, {
                replacements: { userID: adminID },
                type: sequelize.QueryTypes.INSERT,
                transaction
            });

            console.log('Utilisateur admin créé avec succès');
        } else {
            // Mettre à jour le rôle de l'utilisateur existant
            await sequelize.query(`
                UPDATE "Users"
                SET "role" = 'admin'
                WHERE "email" = 'admin@blinker.com';
            `, { transaction });

            console.log('Utilisateur admin mis à jour avec succès');
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
        // Supprimer l'utilisateur admin
        await sequelize.query(`
            DELETE FROM "Users"
            WHERE "email" = 'admin@blinker.com';
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
