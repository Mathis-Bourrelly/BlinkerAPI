const fs = require('fs');
const path = require('path');
const UsersService = require('../src/services/users.service');

const usersFilePath = path.join(__dirname, 'src', 'Users.json');

const seedUsers = async () => {
    try {
        console.log("📥 Début du seeding des utilisateurs...");

        // Lire et parser le fichier JSON
        const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));

        let createdCount = 0;
        let skippedCount = 0;

        // Insérer chaque utilisateur via le service
        for (const user of usersData) {
            try {
                await UsersService.createUser(user);
                createdCount++;
            } catch (error) {
                if (error.message.includes("Un utilisateur avec cet email existe déjà")) {
                    console.warn(`⚠️ Utilisateur existant ignoré : ${user.email}`);
                    skippedCount++;
                } else {
                    console.log(`✅ création de ${user.email}`);
                }
            }
        }

        console.log(`✅ Seeding terminé ! ${createdCount} nouveaux utilisateurs ajoutés, ${skippedCount} ignorés.`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des utilisateurs:", error);
    }
};

module.exports = seedUsers;
