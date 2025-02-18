const UsersService = require('../src/services/users.service');
const FollowsService = require('../src/services/follows.service');

const seedFollows = async () => {
    try {
        console.log("📥 Début du seeding des follows...");

        // Récupérer tous les utilisateurs
        const users = await UsersService.getAllUsers();

        if (users.length < 2) {
            console.warn("⚠️ Pas assez d'utilisateurs pour générer des follows.");
            return;
        }

        let followCount = 0;
        let skippedCount = 0;
        const followRelations = new Set();

        // Générer des relations de follow aléatoires
        for (const follower of users) {
            const followedUsers = users
                .filter(u => u.userID !== follower.userID) // Évite l'auto-follow
                .sort(() => Math.random() - 0.5) // Mélange les utilisateurs
                .slice(0, Math.floor(Math.random() * 4) + 1); // Chaque utilisateur suit entre 1 et 4 autres

            for (const followed of followedUsers) {
                const relationKey = `${follower.userID}-${followed.userID}`;

                if (!followRelations.has(relationKey)) {
                    try {
                        await FollowsService.followUser(follower.userID, followed.userID);
                        followRelations.add(relationKey);
                        followCount++;
                    } catch (error) {
                        console.error(`❌ Erreur lors du follow de ${follower.email} vers ${followed.email} :`, error.message);
                        skippedCount++;
                    }
                } else {
                    console.warn(`⚠️ Relation déjà existante ignorée : ${follower.email} -> ${followed.email}`);
                    skippedCount++;
                }
            }
        }

        console.log(`✅ Seeding terminé ! ${followCount} follows ajoutés, ${skippedCount} ignorés.`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des follows :", error);
    }
};

module.exports = seedFollows;
