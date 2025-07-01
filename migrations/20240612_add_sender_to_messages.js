const { sequelize } = require('../src/core/postgres');

async function addSenderToMessages() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Début de la migration : Ajout du champ senderID à la table Messages');

        // Vérifier si la colonne senderID existe déjà
        const columnExists = await sequelize.query(`
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'Messages'
            AND column_name = 'senderID';
        `, { type: sequelize.QueryTypes.SELECT, transaction });

        if (columnExists.length === 0) {
            // Ajouter la colonne senderID
            await sequelize.query(`
                ALTER TABLE "Messages"
                ADD COLUMN "senderID" UUID;
            `, { transaction });

            console.log('Colonne senderID ajoutée à la table Messages');
        } else {
            console.log('La colonne senderID existe déjà dans la table Messages');
        }

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

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
    addSenderToMessages()
        .then(() => {
            console.log('Migration exécutée avec succès');
            process.exit(0);
        })
        .catch(error => {
            console.error('Erreur lors de la migration :', error);
            process.exit(1);
        });
}

module.exports = addSenderToMessages;
