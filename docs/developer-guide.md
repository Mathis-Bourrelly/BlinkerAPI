# Guide du Développeur - Backend Blinker

## Système de Score Utilisateur

### Implémentation

Le système de score utilisateur est implémenté dans les fichiers suivants :

#### 1. Service Utilisateur (`src/services/users.service.js`)

```javascript
/**
 * Calcule le score d'un utilisateur en fonction de ses blinks
 * @param {string} userID - ID de l'utilisateur
 * @returns {Promise<number>} Le score calculé
 */
UsersService.calculateUserScore = async function(userID) {
    try {
        // Requête SQL optimisée pour calculer le score
        const result = await sequelize.query(`
            SELECT
                COUNT(*) as "blinkCount",
                SUM("likeCount") as "totalLikes",
                SUM("dislikeCount") as "totalDislikes",
                SUM("commentCount") as "totalComments",
                SUM(CASE
                    WHEN tier = 'gold' THEN 100
                    WHEN tier = 'silver' THEN 50
                    WHEN tier = 'bronze' THEN 25
                    ELSE 0
                END) as "tierPoints"
            FROM "Blinks"
            WHERE "userID" = :userID
        `, {
            replacements: { userID },
            type: sequelize.QueryTypes.SELECT
        });

        if (!result || !result[0]) return 0;

        const { blinkCount, totalLikes, totalDislikes, totalComments, tierPoints } = result[0];

        // Formule de calcul du score
        const baseScore = 100; // Score de base
        const likeBonus = parseInt(totalLikes || 0) * 5;
        const dislikePenalty = parseInt(totalDislikes || 0) * 10;
        const commentBonus = parseInt(totalComments || 0) * 2;
        const activityBonus = parseInt(blinkCount || 0) * 3;
        const tierBonus = parseInt(tierPoints || 0);

        // Calculer le score final (minimum 10)
        const score = Math.max(10, baseScore + likeBonus - dislikePenalty + commentBonus + activityBonus + tierBonus);

        return score;
    } catch (error) {
        console.error('Erreur lors du calcul du score:', error);
        return 0; // Score par défaut en cas d'erreur
    }
};

/**
 * Met à jour le score d'un utilisateur
 * @param {string} userID - ID de l'utilisateur
 * @returns {Promise<number>} Le nouveau score
 */
UsersService.updateUserScore = async function(userID) {
    try {
        // Calculer le nouveau score
        const newScore = await this.calculateUserScore(userID);

        // Mettre à jour le profil
        await Profiles.update({ score: newScore }, {
            where: { userID }
        });

        console.log(`Score de l'utilisateur ${userID} mis à jour: ${newScore}`);
        return newScore;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du score de l'utilisateur ${userID}:`, error);
        throw error;
    }
};

/**
 * Met à jour les scores de tous les utilisateurs
 * @returns {Promise<number>} Le nombre d'utilisateurs mis à jour
 */
UsersService.updateAllUserScores = async function() {
    try {
        const users = await this.getAllUsers();
        let updatedCount = 0;

        for (const user of users) {
            await this.updateUserScore(user.userID);
            updatedCount++;
        }

        console.log(`Scores mis à jour pour ${updatedCount} utilisateurs`);
        return updatedCount;
    } catch (error) {
        console.error('Erreur lors de la mise à jour des scores:', error);
        throw error;
    }
};
```

#### 2. Service de Profil (`src/services/profiles.service.js`)

```javascript
/**
 * Récupère un profil par userID, en utilisant le score stocké et en construisant l'URL complète de l'avatar.
 * @param {string} userID - UUID de l'utilisateur.
 * @returns {Promise<Object>} Le profil trouvé avec l'URL complète de l'avatar.
 * @throws {Error} Si le profil n'existe pas.
 */
async getProfileByUserID(userID) {
    const profile = await ProfilesRepository.findByUserID(userID);
    if (!profile) {
        throw {message: ErrorCodes.Profiles.NotFound};
    }

    // Utiliser le score stocké dans le profil au lieu de le recalculer
    // Si le score est 0, on peut le mettre à jour (cas d'un nouveau profil)
    if (profile.score === 0) {
        const UsersService = require('./users.service');
        await UsersService.updateUserScore(userID);
        // Récupérer le profil mis à jour
        const updatedProfile = await ProfilesRepository.findByUserID(userID);
        if (updatedProfile) {
            profile.score = updatedProfile.score;
        }
    }

    // Construire l'URL complète de l'avatar si elle existe
    profile.avatar_url = this.buildAvatarUrl(profile.avatar_url);

    return profile;
}
```

#### 3. Service de Messages (`src/services/messages.service.js`)

```javascript
/**
 * Envoie un message et définit sa durée de vie en fonction des scores des utilisateurs.
 * @param {string} userID - ID de l'utilisateur qui envoie le message
 * @param {string} receiverID - ID du destinataire (optionnel si conversationID est fourni)
 * @param {string} content - Contenu du message
 * @param {string} conversationID - ID de la conversation (optionnel, créé automatiquement si absent)
 * @returns {Promise<Object>} Le message créé
 */
async sendMessage(userID, receiverID, content, conversationID = null) {
    const transaction = await sequelize.transaction();

    try {
        let conversation;

        // Logique pour créer ou récupérer une conversation...

        // Calcul de la durée de vie en fonction des scores stockés dans les profils
        const participants = conversation.participants;

        // Récupérer les profils des participants avec leurs scores
        const profiles = await Profiles.findAll({
            where: { userID: { [Op.in]: participants } },
            attributes: ['userID', 'score']
        });

        // Extraire les scores des profils
        const scores = profiles.map(p => p.score);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const averageLifetime = Math.max(Math.round(averageScore), 86400); // 1 jour minimum
        const expiresAt = new Date(Date.now() + averageLifetime * 1000);

        // Créer le message
        const message = await Messages.create({
            conversationID,
            content,
            expiresAt,
            isRead: false
        }, { transaction });

        await transaction.commit();
        return message;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
```

#### 4. Service de Blinks (`src/services/blinks.service.js`)

```javascript
async createBlinkWithContent({ userID, contents }) {
    const transaction = await sequelize.transaction();
    try {
        const blink = await BlinkRepository.createBlink(userID, transaction);
        await BlinkRepository.addBlinkContents(blink.blinkID, contents, transaction);
        await transaction.commit();

        // Mettre à jour le score de l'utilisateur après la création du blink
        await UsersService.updateUserScore(userID);

        return blink;
    } catch (error) {
        await transaction.rollback();
        throw { message: error.message || ErrorCodes.Base.UnknownError };
    }
}
```

#### 5. Tâches planifiées (`src/core/cron.js`)

```javascript
// Mise à jour des scores utilisateurs toutes les 12 heures
setInterval(updateAllUserScores, 12 * 3600000);

// Exécuter la mise à jour des scores au démarrage
setTimeout(updateAllUserScores, 60000); // Attendre 1 minute après le démarrage
```

### Modèle de données

#### Table `Profiles`

La table `Profiles` contient un champ `score` qui stocke le score calculé de l'utilisateur :

```javascript
const Profiles = sequelize.define('Profiles', {
    profileID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userID: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'Users',
            key: 'userID'
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    display_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'Profiles',
    timestamps: true
});
```

## Système de Messagerie

### Modèle de données

#### Table `Conversations`

```javascript
const Conversations = sequelize.define('Conversations', {
    conversationID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    participants: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false
    }
}, {
    tableName: 'Conversations',
    timestamps: true
});
```

#### Table `Messages`

```javascript
const Messages = sequelize.define('Messages', {
    messageID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    conversationID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Conversations',
            key: 'conversationID'
        },
        onDelete: 'CASCADE'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'Messages',
    timestamps: true
});
```

## Bonnes pratiques

### Mise à jour du score

1. **Quand mettre à jour le score ?**
   - Après la création d'un blink
   - Après un like/dislike sur un blink
   - Après l'ajout d'un commentaire
   - Périodiquement via la tâche CRON

2. **Comment accéder au score ?**
   - Utiliser le score stocké dans le profil

3. **Gestion des erreurs**
   - En cas d'erreur lors du calcul du score, utiliser une valeur par défaut (0 ou 10)
   - Logger les erreurs pour le débogage

## Dépannage

### Problèmes courants

1. **Score incorrect**
   - Vérifier que les mises à jour sont déclenchées correctement
   - Exécuter manuellement `UsersService.updateUserScore(userID)`

2. **Performances lentes**
   - Vérifier les logs pour des erreurs ou des avertissements
   - Analyser les requêtes SQL exécutées

3. **Messages expirant trop rapidement**
   - Vérifier les scores des utilisateurs impliqués
   - S'assurer que la formule de calcul de durée de vie est correcte

### Commandes utiles

```bash
# Mettre à jour manuellement tous les scores utilisateurs
node -e "require('./src/services/users.service').updateAllUserScores()"

# Exécuter le seeder de messages pour tester les performances
node seeders/run-messages-seeder.js
```

---

Document mis à jour le : 12 juin 2024
