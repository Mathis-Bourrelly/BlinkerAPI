const { sequelize } = require('../src/core/postgres');

async function up() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Début de la migration : Modification du champ receiverID dans la table Messages');

        // Rendre la colonne receiverID nullable
        await sequelize.query(`
            ALTER TABLE "Messages"
            ALTER COLUMN "receiverID" DROP NOT NULL;
        `, { transaction });

        console.log('Colonne receiverID modifiée avec succès (nullable)');

        // Commit de la transaction
        await transaction.commit();
        console.log('Migration terminée avec succès');
    } catch (error) {
        // Rollback en cas d'erreur
        await transaction.rollback();
        console.error('Erreur lors de la migration :', error);
        throw error;
    }
}

async function down() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Début du rollback : Restauration du champ receiverID dans la table Messages');

        // Rendre la colonne receiverID NOT NULL à nouveau
        await sequelize.query(`
            ALTER TABLE "Messages"
            ALTER COLUMN "receiverID" SET NOT NULL;
        `, { transaction });

        console.log('Colonne receiverID restaurée avec succès (NOT NULL)');

        // Commit de la transaction
        await transaction.commit();
        console.log('Rollback terminé avec succès');
    } catch (error) {
        // Rollback en cas d'erreur
        await transaction.rollback();
        console.error('Erreur lors du rollback :', error);
        throw error;
    }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
    up()
        .then(() => {
            console.log('Migration exécutée avec succès');
            process.exit(0);
        })
        .catch(error => {
            console.error('Erreur lors de la migration :', error);
            process.exit(1);
        });
}

module.exports = { up, down };
