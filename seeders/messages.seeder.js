const UsersService = require('../src/services/users.service');
const MessagesService = require('../src/services/messages.service');
const ConversationService = require('../src/services/conversations.service');

// Phrases aléatoires pour les messages
const messageTemplates = [
    "Salut, comment ça va ?",
    "Bonjour ! Tu as passé une bonne journée ?",
    "Est-ce que tu as vu le dernier épisode ?",
    "On se retrouve où et quand ?",
    "J'ai une question à te poser...",
    "Tu es disponible demain ?",
    "Merci pour ton aide !",
    "Je voulais te dire que j'ai adoré ton dernier blink !",
    "As-tu des nouvelles de ce projet ?",
    "Je pense qu'on devrait en discuter plus tard.",
    "Qu'est-ce que tu en penses ?",
    "Je suis d'accord avec toi.",
    "Pas de problème, à bientôt !",
    "Je ne suis pas sûr de comprendre...",
    "Peux-tu m'expliquer comment ça fonctionne ?",
    "C'est une excellente idée !",
    "Je ne pense pas que ce soit une bonne approche.",
    "On pourrait essayer autre chose ?",
    "Je suis occupé en ce moment, je te réponds plus tard.",
    "Félicitations pour ta réussite !",
    "J'ai hâte de te voir !",
    "N'oublie pas notre rendez-vous.",
    "Je t'envoie le document dès que possible.",
    "As-tu reçu mon message précédent ?",
    "Désolé pour le retard de ma réponse."
];

// Fonction pour obtenir une date aléatoire dans les 30 derniers jours
const getRandomDate = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
};

// Fonction pour obtenir un message aléatoire
const getRandomMessage = () => {
    return messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
};

// Fonction pour créer un message directement dans la base de données
const createMessage = async (conversationID, content, isRead = false, senderID = null) => {
    // Définir une date d'expiration (7 jours par défaut)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer le message directement via le modèle pour éviter les calculs de score
    const Messages = require('../src/models/messages');
    return await Messages.create({
        conversationID,
        content,
        expiresAt,
        isRead,
        senderID, // Maintenant nous utilisons senderID dans le modèle
        createdAt: getRandomDate()
    });
};

const seedMessages = async () => {
    try {
        console.log("📥 Début du seeding des messages...");

        // Récupérer tous les utilisateurs
        const users = await UsersService.getAllUsers();

        if (users.length < 2) {
            console.warn("⚠️ Pas assez d'utilisateurs pour générer des messages.");
            return;
        }

        let conversationCount = 0;
        let messageCount = 0;
        const conversationPairs = new Set();

        // Limiter le nombre d'utilisateurs pour accélérer le seeding
        const maxUsers = Math.min(users.length, 10); // Limiter à 10 utilisateurs maximum

        console.log(`🔄 Génération de conversations pour ${maxUsers} utilisateurs...`);

        // Créer des conversations entre utilisateurs aléatoires
        for (let i = 0; i < maxUsers; i++) {
            // Chaque utilisateur aura entre 1 et 3 conversations
            const numConversations = Math.floor(Math.random() * 2) + 1; // Réduire à 1-2 conversations

            for (let j = 0; j < numConversations; j++) {
                // Choisir un autre utilisateur aléatoire
                let otherUserIndex;
                do {
                    otherUserIndex = Math.floor(Math.random() * maxUsers);
                } while (otherUserIndex === i);

                const user1 = users[i];
                const user2 = users[otherUserIndex];

                // Créer une clé unique pour cette paire d'utilisateurs
                const pairKey = [user1.userID, user2.userID].sort().join('-');

                // Vérifier si cette paire existe déjà
                if (!conversationPairs.has(pairKey)) {
                    conversationPairs.add(pairKey);

                    try {
                        // Créer une conversation entre ces deux utilisateurs
                        const conversation = await ConversationService.createConversation([user1.userID, user2.userID]);
                        conversationCount++;

                        // Générer entre 4 et 8 messages pour cette conversation (nombre pair pour avoir des messages des deux côtés)
                        const numMessages = (Math.floor(Math.random() * 3) + 2) * 2; // 4, 6 ou 8 messages

                        console.log(`🔄 Création de ${numMessages} messages pour la conversation ${conversationCount}...`);

                        // Créer des messages alternés entre les deux participants
                        const participants = [user1.userID, user2.userID];

                        // Créer un tableau de dates croissantes pour simuler une conversation réelle
                        const messageDates = [];
                        for (let k = 0; k < numMessages; k++) {
                            messageDates.push(getRandomDate());
                        }
                        messageDates.sort((a, b) => a - b); // Trier par ordre chronologique

                        for (let k = 0; k < numMessages; k++) {
                            // Alterner les expéditeurs
                            const senderIndex = k % 2;
                            const senderID = participants[senderIndex];
                            const receiverID = participants[1 - senderIndex];

                            // Créer un message avec une date spécifique
                            const content = getRandomMessage();

                            // Déterminer si le message est lu (les messages plus anciens ont plus de chances d'être lus)
                            const isRead = Math.random() > (k / numMessages * 0.7 + 0.1); // 90% de chance pour les premiers messages, 30% pour les derniers

                            // Créer le message directement sans passer par le service
                            const message = await createMessage(
                                conversation.conversationID,
                                content,
                                isRead,
                                senderID // Nous ne stockons pas cette information, mais elle est utile pour la logique
                            );

                            // Mettre à jour la date de création pour avoir une chronologie réaliste
                            await message.update({ createdAt: messageDates[k] });

                            messageCount++;
                        }

                        console.log(`✅ Conversation créée entre ${user1.email} et ${user2.email} avec ${numMessages} messages`);
                    } catch (error) {
                        console.error(`❌ Erreur lors de la création de la conversation entre ${user1.email} et ${user2.email}:`, error.message);
                    }
                }
            }
        }

        console.log(`📊 Résumé du seeding des messages:`);
        console.log(`   - ${conversationCount} conversations créées`);
        console.log(`   - ${messageCount} messages générés (avec des messages des deux côtés)`);

        return { conversationCount, messageCount };
    } catch (error) {
        console.error('❌ Erreur lors du seeding des messages:', error);
        throw error;
    }
};

module.exports = seedMessages;
