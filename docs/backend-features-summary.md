# Fonctionnalités du Backend Blinker

## Système de Score Utilisateur

![Système de Score](https://via.placeholder.com/800x400?text=Système+de+Score+Utilisateur)

### Comment fonctionne le score ?
Le score d'un utilisateur est basé uniquement sur la durée de vie moyenne de ses blinks :
- ⏱️ Calculé en secondes (86400 = 24 heures)
- 📈 Moyenne des durées de vie des blinks supprimés
- 💾 Enregistré dans la table BlinkLifetimes
- 🔄 Mis à jour lors de la suppression d'un blink

### Impact sur l'expérience utilisateur
- ⏱️ Messages qui durent plus longtemps pour les utilisateurs actifs et appréciés
- 🚀 Temps de réponse amélioré pour l'envoi de messages
- 💪 Incitation à publier du contenu de qualité

## Système de Messagerie Basé sur les Conversations

![Système de Messagerie](https://via.placeholder.com/800x400?text=Système+de+Messagerie)

- 💬 Architecture basée sur les conversations
- 👥 Support pour les conversations à plusieurs (préparation future)
- ⏳ Durée de vie des messages basée sur le score moyen des participants
- 🔄 Suppression automatique des messages expirés

## Gestion des Profils et Avatars

![Gestion des Profils](https://via.placeholder.com/800x400?text=Gestion+des+Profils)

- 🖼️ Upload d'avatars avec gestion des URLs adaptative
- 📱 URLs construites dynamiquement selon l'environnement
- 🔒 Stockage sécurisé des informations utilisateur

---

*Note: Remplacez les images placeholder par des captures d'écran ou des diagrammes réels pour une présentation plus visuelle.*
