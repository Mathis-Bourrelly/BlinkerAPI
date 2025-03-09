const UsersService = require('../src/services/users.service');
const BlinkService = require('../src/services/blinks.service');

const seedBlinks = async () => {
    try {
        console.log("📥 Début du seeding des blinks...");

        // Récupérer tous les utilisateurs existants
        const users = await UsersService.getAllUsers();
        if (!users || users.length === 0) {
            console.warn("⚠️ Aucun utilisateur trouvé pour attribuer les blinks.");
            return;
        }

        let blinkCount = 0;
        const numberOfBlinks = 50;

        // Générer des blinks
        for (let i = 0; i < numberOfBlinks; i++) {
            // Choisir aléatoirement un utilisateur
            const randomUser = users[Math.floor(Math.random() * users.length)];

            // Générer un nombre aléatoire de contenus (entre 1 et 3) pour ce blink
            const nbContents = Math.floor(Math.random() * 3) + 1;
            const contents = [];
            for (let j = 0; j < nbContents; j++) {
                const contentTypes = ['text', 'image', 'video'];
                const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
                let contentValue;

                if (randomType === 'text') {
                    contentValue = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad adipisci alias asperiores at debitis esse unde. Accusantium aliquid doloremque fugit illum impedit ipsa magni officia, perspiciatis quaerat quasi repudiandae tempora.";
                } else if (randomType === 'image') {
                    contentValue = `https://picsum.photos/960/540?random=${Math.floor(Math.random() * 20 + 1)}`;
                } else if (randomType === 'video') {
                    contentValue = Math.floor(Math.random() * 4 + 1);
                }

                contents.push({
                    contentType: randomType,
                    content: contentValue,
                    position: j + 1
                });
            }

            // Utiliser le service pour créer le blink avec son contenu
            await BlinkService.createBlinkWithContent({
                userID: randomUser.userID,
                contents: contents
            });
            console.log(`🔹 Blink créé pour l'utilisateur ${randomUser.userID}`);
            blinkCount++;
        }

        console.log(`✅ Seeding terminé ! ${blinkCount} blinks ajoutés.`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des blinks :", error);
    }
};

module.exports = seedBlinks;
