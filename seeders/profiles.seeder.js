const fs = require('fs');
const path = require('path');
const ProfilesService = require('../src/services/profiles.service');

const profilesFilePath = path.join(__dirname, '/src/Profiles.json');

const seedProfiles = async () => {
    try {
        console.log("📥 Début du seeding des profils...");

        // Lire et parser le fichier JSON
        const profilesData = JSON.parse(fs.readFileSync(profilesFilePath, 'utf8'));

        let createdCount = 0;
        let skippedCount = 0;

        for (const profile of profilesData) {
            try {
                // Vérifie si un profil existe déjà pour cet utilisateur
                await ProfilesService.getProfileByUserID(profile.userID);
                console.warn(`⚠️ Profil existant ignoré pour ${profile.username}`);
                skippedCount++;
                continue;
            } catch (error) {
                if (error.statusCode !== 404) {
                    console.error(`❌ Erreur lors de la vérification du profil ${profile.username} :`, error.message);
                    continue;
                }
            }

            // Création du profil
            try {
                await ProfilesService.createProfile(profile);
                createdCount++;
            } catch (error) {
                console.error(`❌ Erreur lors de la création du profil ${profile.username} :`, error.message);
            }
        }

        console.log(`✅ Seeding terminé ! ${createdCount} nouveaux profils ajoutés, ${skippedCount} ignorés.`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des profils :", error);
    }
};

module.exports = seedProfiles;
