const UsersService = require('../src/services/users.service');
const BlinkService = require('../src/services/blinks.service');
const InteractionsService = require('../src/services/interactions.service');

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
        let likeCount = 0;
        let dislikeCount = 0;
        const numberOfBlinks = 100;

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
            const blink = await BlinkService.createBlinkWithContentAndDate({
                userID: randomUser.userID,
                contents: contents,
                date: getRandomDate(),
            });
            console.log(`🔹 Blink créé pour l'utilisateur ${randomUser.userID}`);
            blinkCount++;

            // Ajouter des likes et dislikes aléatoires
            // Nombre de likes (entre 0 et 20)
            const numberOfLikes = Math.floor(Math.random() * 21);
            // Nombre de dislikes (entre 0 et 10)
            const numberOfDislikes = Math.floor(Math.random() * 11);

            // Garder une trace des utilisateurs qui ont déjà interagi avec ce blink
            const interactedUsers = new Set();

            // Ajouter des likes
            for (let k = 0; k < numberOfLikes; k++) {
                // Choisir un utilisateur aléatoire différent du créateur du blink
                let likerIndex;
                let likerUser;
                do {
                    likerIndex = Math.floor(Math.random() * users.length);
                    likerUser = users[likerIndex];
                } while (likerUser.userID === randomUser.userID || interactedUsers.has(likerUser.userID));

                // Ajouter l'utilisateur à la liste des utilisateurs ayant interagi
                interactedUsers.add(likerUser.userID);

                // Ajouter le like
                await InteractionsService.toggleLike(blink.blinkID, likerUser.userID);
                likeCount++;
            }

            // Ajouter des dislikes
            for (let l = 0; l < numberOfDislikes; l++) {
                // Choisir un utilisateur aléatoire différent du créateur du blink et qui n'a pas déjà liké
                let dislikerIndex;
                let dislikerUser;
                do {
                    dislikerIndex = Math.floor(Math.random() * users.length);
                    dislikerUser = users[dislikerIndex];
                } while (dislikerUser.userID === randomUser.userID || interactedUsers.has(dislikerUser.userID));

                // Ajouter l'utilisateur à la liste des utilisateurs ayant interagi
                interactedUsers.add(dislikerUser.userID);

                // Ajouter le dislike
                await InteractionsService.toggleDislike(blink.blinkID, dislikerUser.userID);
                dislikeCount++;
            }
        }

        console.log(`✅ Seeding terminé ! ${blinkCount} blinks ajoutés avec ${likeCount} likes et ${dislikeCount} dislikes.`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des blinks :", error);
    }
};

function getRandomDate() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const minOffset = 10 * 1000;
    const maxOffset = 24 * 60 * 60 * 1000;

    const randomOffset = Math.floor(Math.random() * (maxOffset - minOffset)) + minOffset;

    return new Date(yesterday.getTime() + randomOffset);
}


module.exports = seedBlinks;
