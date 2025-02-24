const fs = require('fs');
const path = require('path');
const ProfilesService = require('../src/services/profiles.service');
const UsersService = require('../src/services/users.service');

const profilesFilePath = path.join(__dirname, '../seeders/src/Profiles.json');

const seedProfiles = async () => {
    try {
        console.log("📥 Début du seeding des profils...");

        // Charger les données du fichier JSON
        const profilesData = JSON.parse(fs.readFileSync(profilesFilePath, 'utf8'));

        // Récupérer tous les utilisateurs existants
        const users = await UsersService.getAllUsers();
        if (!users || users.length === 0) {
            console.warn("⚠️ Aucun utilisateur trouvé. Seeding annulé.");
            return;
        }

        let createdCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const index = users.indexOf(user);
            const profileInfo = profilesData[index % profilesData.length];


            // Construire le profil avec les données du JSON
            const profileData = {
                userID: user.userID,
                display_name: profileInfo.display_name,
                username: profileInfo.username,
                bio: profileInfo.bio || null,
                avatar_url: profileInfo.avatar_url || null,
                score: 0, // Valeur par défaut
            };
            // Création du profil
            try {
                await ProfilesService.createProfile(profileData);
                console.log(`✅ Profil créé pour ${profileInfo.username} avec userID: ${user.id}`);
                createdCount++;
            } catch (error) {
                console.error(`❌ Erreur lors de la création du profil ${profileInfo.username} :`, error.message);
            }
        }

        console.log(`✅ Seeding terminé ! ${createdCount} nouveaux profils ajoutés, ${skippedCount} ignorés.`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des profils :", error);
    }
};

module.exports = seedProfiles;