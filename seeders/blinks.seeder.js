const UsersService = require('../src/services/users.service');
const BlinkService = require('../src/services/blinks.service');
const InteractionsService = require('../src/services/interactions.service');
const CommentsService = require('../src/services/comments.service');
const { seedTags, getThematicTags } = require('./tags.seeder');

const commentsService = new CommentsService();

const seedBlinks = async () => {
    try {
        console.log("📥 Début du seeding complet (tags, blinks, interactions, commentaires)...");

        // Étape 1: Seeder les tags d'abord
        console.log("\n🏷️ === ÉTAPE 1: SEEDING DES TAGS ===");
        await seedTags();

        // Récupérer tous les utilisateurs existants
        const users = await UsersService.getAllUsers();
        if (!users || users.length === 0) {
            console.warn("⚠️ Aucun utilisateur trouvé pour attribuer les blinks.");
            return;
        }

        console.log("\n📝 === ÉTAPE 2: SEEDING DES BLINKS AVEC TAGS ===");
        let blinkCount = 0;
        let likeCount = 0;
        let dislikeCount = 0;
        let tagAssignmentCount = 0;
        const numberOfBlinks = 50;

        // Générer des blinks avec tags
        for (let i = 0; i < numberOfBlinks; i++) {
            // Choisir aléatoirement un utilisateur
            const randomUser = users[Math.floor(Math.random() * users.length)];

            // Générer un nombre aléatoire de contenus (entre 1 et 3) pour ce blink
            const nbContents = Math.floor(Math.random() * 3) + 1;
            const contents = [];
            let primaryContentType = 'text';
            let primaryContent = '';

            for (let j = 0; j < nbContents; j++) {
                const contentTypes = ['text', 'image', 'video'];
                const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
                let contentValue;

                if (randomType === 'text') {
                    const textVariations = [
                        "Découverte incroyable aujourd'hui ! La technologie continue de nous surprendre 🚀",
                        "Moment de détente parfait avec cette vue magnifique 🌅",
                        "Nouvelle recette testée et approuvée ! Un délice pour les papilles 🍽️",
                        "Session de sport intense ce matin. Rien de mieux pour commencer la journée 💪",
                        "Lecture passionnante qui m'a fait réfléchir sur notre société moderne 📚",
                        "Projet créatif en cours... L'inspiration frappe quand on s'y attend le moins ✨",
                        "Voyage inoubliable dans un endroit magique. La nature est si belle 🌍",
                        "Innovation fascinante dans le domaine de l'IA. L'avenir s'annonce prometteur 🤖",
                        "Moment de partage avec des amis. Ces instants sont précieux 👥",
                        "Découverte artistique qui m'a bouleversé. L'art a ce pouvoir unique 🎨"
                    ];
                    contentValue = textVariations[Math.floor(Math.random() * textVariations.length)];
                } else if (randomType === 'image') {
                    contentValue = `https://picsum.photos/960/540?random=${Math.floor(Math.random() * 100 + 1)}`;
                } else if (randomType === 'video') {
                    contentValue = Math.floor(Math.random() * 4 + 1);
                }

                contents.push({
                    contentType: randomType,
                    content: contentValue,
                    position: j + 1
                });

                // Garder le premier contenu pour déterminer les tags
                if (j === 0) {
                    primaryContentType = randomType;
                    primaryContent = contentValue;
                }
            }

            // Générer des tags thématiques basés sur le contenu principal
            const tags = getThematicTags(primaryContentType, primaryContent);

            // Utiliser le service pour créer le blink avec son contenu et ses tags
            // Passer skipScoreUpdate=true pour éviter les problèmes de dépendances circulaires
            const blink = await BlinkService.createBlinkWithContentAndDate({
                userID: randomUser.userID,
                contents: contents,
                tags: tags,
                date: getRandomDate(),
                skipScoreUpdate: true // Éviter la mise à jour du score pendant le seeding
            });

            console.log(`🔹 Blink créé pour l'utilisateur ${randomUser.userID} avec ${tags.length} tag(s): ${tags.join(', ')}`);
            blinkCount++;
            tagAssignmentCount += tags.length;

            // Ajouter des likes et dislikes aléatoires
            // Nombre de likes (entre 0 et 3)
            const numberOfLikes = Math.floor(Math.random() * 4);
            // Nombre de dislikes (entre 0 et 2)
            const numberOfDislikes = Math.floor(Math.random() * 3);

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

        console.log(`✅ Étape 2 terminée ! ${blinkCount} blinks ajoutés avec ${tagAssignmentCount} tags, ${likeCount} likes et ${dislikeCount} dislikes.`);

        // Étape 3: Ajouter des commentaires aux blinks
        console.log("\n💬 === ÉTAPE 3: SEEDING DES COMMENTAIRES ===");
        await seedComments(users);

        console.log("\n🎉 === SEEDING COMPLET TERMINÉ ===");
        console.log(`📊 Résumé final:`);
        console.log(`   - ${blinkCount} blinks créés`);
        console.log(`   - ${tagAssignmentCount} associations de tags`);
        console.log(`   - ${likeCount} likes ajoutés`);
        console.log(`   - ${dislikeCount} dislikes ajoutés`);
        console.log(`   - Commentaires ajoutés (voir détails ci-dessus)`);
    } catch (error) {
        console.error("❌ Erreur lors du seeding des blinks :", error);
    }
};

// Fonction pour seeder les commentaires (intégrée)
const seedComments = async (users) => {
    try {
        // Importer les modèles nécessaires
        const { Blinks } = require('../src/models/associations');

        console.log('🗨️ Début du seeding des commentaires...');

        // Récupérer les blinks récemment créés
        const blinks = await Blinks.findAll({
            limit: 30,
            order: [['createdAt', 'DESC']]
        });

        if (blinks.length === 0) {
            console.log('❌ Aucun blink trouvé pour les commentaires.');
            return;
        }

        console.log(`📊 ${blinks.length} blinks trouvés pour les commentaires`);

        const commentContents = [
            "Super blink ! J'adore ce contenu 😍",
            "Très intéressant, merci pour le partage !",
            "Excellent travail, continue comme ça 👏",
            "Ça me rappelle de bons souvenirs",
            "Magnifique ! Où as-tu pris cette photo ?",
            "Trop drôle 😂😂😂",
            "Merci pour cette inspiration !",
            "Wow, impressionnant !",
            "J'aimerais en savoir plus sur ce sujet",
            "Bravo pour cette réalisation !",
            "C'est exactement ce que je cherchais",
            "Très utile, je vais essayer ça",
            "Belle perspective sur le sujet",
            "Ça donne envie de voyager !",
            "Merci pour ce moment de détente",
            "Génial ! Continue comme ça 🔥",
            "Très créatif, j'adore l'idée",
            "Ça m'inspire pour mes propres projets",
            "Superbe qualité, bravo !",
            "Moment magique capturé parfaitement ✨"
        ];

        let commentsCreated = 0;
        let commentsSkipped = 0;

        // Créer des commentaires pour une sélection de blinks
        for (const blink of blinks) {
            // Probabilité de 70% qu'un blink ait des commentaires
            if (Math.random() < 0.3) continue;

            // Sélectionner aléatoirement 1-4 utilisateurs pour commenter ce blink
            const numComments = Math.floor(Math.random() * 4) + 1;
            const shuffledUsers = users.sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, numComments);

            for (const user of selectedUsers) {
                try {
                    // Vérifier si l'utilisateur a déjà commenté ce blink
                    const existingComment = await commentsService.getUserCommentForBlink(blink.blinkID, user.userID);

                    if (existingComment) {
                        commentsSkipped++;
                        continue;
                    }

                    // Sélectionner un contenu de commentaire aléatoire
                    const randomContent = commentContents[Math.floor(Math.random() * commentContents.length)];

                    // Créer le commentaire
                    await commentsService.createComment(
                        blink.blinkID,
                        user.userID,
                        randomContent
                    );

                    commentsCreated++;

                    // Petite pause pour éviter de surcharger la base
                    await new Promise(resolve => setTimeout(resolve, 50));

                } catch (error) {
                    if (error.message && error.message.includes('AlreadyCommented')) {
                        commentsSkipped++;
                    } else {
                        console.error(`❌ Erreur commentaire pour ${user.userID}:`, error.message);
                    }
                }
            }
        }

        console.log(`✅ Commentaires: ${commentsCreated} créés, ${commentsSkipped} ignorés`);

    } catch (error) {
        console.error('❌ Erreur lors du seeding des commentaires:', error);
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
