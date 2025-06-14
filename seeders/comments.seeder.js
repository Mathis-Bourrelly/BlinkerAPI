// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const { Comments, Blinks, Users } = require('../src/models/associations');
const CommentsService = require('../src/services/comments.service');

const commentsService = new CommentsService();

const seedComments = async () => {
    try {
        console.log('🗨️ Début du seeding des commentaires...');

        // Récupérer quelques blinks et utilisateurs existants
        const blinks = await Blinks.findAll({ limit: 5 });
        const users = await Users.findAll({ limit: 10 });

        if (blinks.length === 0) {
            console.log('❌ Aucun blink trouvé. Veuillez d\'abord exécuter le seeder des blinks.');
            return;
        }

        if (users.length === 0) {
            console.log('❌ Aucun utilisateur trouvé. Veuillez d\'abord exécuter le seeder des utilisateurs.');
            return;
        }

        console.log(`📊 ${blinks.length} blinks et ${users.length} utilisateurs trouvés`);

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
            "Merci pour ce moment de détente"
        ];

        let commentsCreated = 0;
        let commentsSkipped = 0;

        // Créer des commentaires pour chaque blink
        for (const blink of blinks) {
            console.log(`\n📝 Création de commentaires pour le blink ${blink.blinkID}...`);
            
            // Sélectionner aléatoirement 2-5 utilisateurs pour commenter ce blink
            const numComments = Math.floor(Math.random() * 4) + 2; // 2 à 5 commentaires
            const shuffledUsers = users.sort(() => 0.5 - Math.random());
            const selectedUsers = shuffledUsers.slice(0, numComments);

            for (const user of selectedUsers) {
                try {
                    // Vérifier si l'utilisateur a déjà commenté ce blink
                    const existingComment = await commentsService.getUserCommentForBlink(blink.blinkID, user.userID);
                    
                    if (existingComment) {
                        console.log(`⚠️ L'utilisateur ${user.userID} a déjà commenté le blink ${blink.blinkID}`);
                        commentsSkipped++;
                        continue;
                    }

                    // Sélectionner un contenu de commentaire aléatoire
                    const randomContent = commentContents[Math.floor(Math.random() * commentContents.length)];

                    // Créer le commentaire
                    const comment = await commentsService.createComment(
                        blink.blinkID,
                        user.userID,
                        randomContent
                    );

                    console.log(`✅ Commentaire créé: ${comment.commentID} par ${user.userID}`);
                    commentsCreated++;

                    // Petite pause pour éviter de surcharger la base
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    if (error.message && error.message.includes('AlreadyCommented')) {
                        console.log(`⚠️ L'utilisateur ${user.userID} a déjà commenté le blink ${blink.blinkID}`);
                        commentsSkipped++;
                    } else {
                        console.error(`❌ Erreur lors de la création du commentaire pour ${user.userID} sur ${blink.blinkID}:`, error.message);
                    }
                }
            }
        }

        console.log('\n📊 Résumé du seeding des commentaires:');
        console.log(`✅ Commentaires créés: ${commentsCreated}`);
        console.log(`⚠️ Commentaires ignorés (déjà existants): ${commentsSkipped}`);
        console.log('🎉 Seeding des commentaires terminé avec succès !');

        // Afficher quelques statistiques
        const totalComments = await Comments.count();
        console.log(`📈 Total des commentaires en base: ${totalComments}`);

        // Afficher les blinks avec leurs nouveaux compteurs de commentaires
        const blinksWithComments = await Blinks.findAll({
            attributes: ['blinkID', 'commentCount'],
            where: {
                commentCount: { [require('sequelize').Op.gt]: 0 }
            }
        });

        console.log('\n📊 Blinks avec commentaires:');
        blinksWithComments.forEach(blink => {
            console.log(`  - Blink ${blink.blinkID}: ${blink.commentCount} commentaire(s)`);
        });

    } catch (error) {
        console.error('❌ Erreur lors du seeding des commentaires:', error);
        throw error;
    }
};

module.exports = seedComments;

// Exécuter le seeder si ce fichier est appelé directement
if (require.main === module) {
    seedComments()
        .then(() => {
            console.log('✅ Seeder des commentaires exécuté avec succès');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur lors de l\'exécution du seeder:', error);
            process.exit(1);
        });
}
