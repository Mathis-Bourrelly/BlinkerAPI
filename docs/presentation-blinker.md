# Présentation de l'Application Blinker

## Qu'est-ce que Blinker ?

Blinker est une application de messagerie et de partage de contenu éphémère qui offre une expérience unique centrée sur la qualité des interactions. Contrairement aux réseaux sociaux traditionnels, Blinker valorise le contenu pertinent et apprécié par la communauté en prolongeant sa durée de vie.

## Fonctionnalités Principales

### 📱 Blinks - Publications Éphémères

Les "Blinks" sont des publications temporaires qui peuvent contenir du texte, des images ou des vidéos :

- **Contenu éphémère** : Chaque blink a une durée de vie limitée
- **Multi-format** : Support pour le texte, les images et les vidéos
- **Interactions sociales** : Possibilité de liker, disliker et commenter les blinks
- **Système de tiers** : Les blinks peuvent atteindre différents niveaux (bronze, argent, or) selon leur popularité

### 💬 Messagerie Basée sur les Conversations

Un système de messagerie privée avec des caractéristiques uniques :

- **Architecture par conversations** : Organisation des messages en conversations
- **Durée de vie dynamique** : Les messages expirent automatiquement après une période déterminée par le score des utilisateurs
- **Notifications en temps réel** : Utilisation de WebSockets pour des notifications instantanées
- **Préparation pour les conversations de groupe** : Architecture conçue pour supporter les conversations à plusieurs participants

### 👤 Profils Utilisateurs

Des profils riches qui reflètent l'activité et la réputation des utilisateurs :

- **Informations personnalisables** : Nom d'affichage, nom d'utilisateur, bio et avatar
- **Système de score** : Score basé sur la durée de vie moyenne des blinks de l'utilisateur
- **Relations sociales** : Possibilité de suivre d'autres utilisateurs
- **Gestion des avatars** : Upload et affichage d'avatars avec URLs adaptatives selon l'environnement

### ⭐ Système de Score Utilisateur

Un mécanisme unique qui récompense la qualité des contributions :

- **Calcul basé sur la performance** : Score calculé à partir de la durée de vie moyenne des blinks
- **Impact sur l'expérience** : Plus le score est élevé, plus les messages envoyés restent disponibles longtemps
- **Incitation à la qualité** : Encourage les utilisateurs à publier du contenu apprécié par la communauté
- **Mise à jour automatique** : Le score est recalculé lors d'événements clés (création/suppression de blinks)

## Architecture Technique

Blinker est construit avec une architecture moderne et performante :

- **Backend** : Node.js et Express avec PostgreSQL comme base de données
- **API REST** : Endpoints standardisés avec validation et documentation Swagger
- **WebSockets** : Communication en temps réel pour la messagerie
- **Architecture modulaire** : Organisation en services, repositories et contrôleurs
- **Sécurité** : Authentification par JWT et gestion sécurisée des données utilisateur

## Avantages Distinctifs

- **Contenu de qualité** : Le système de score encourage la création de contenu pertinent
- **Expérience personnalisée** : La durée de vie des messages s'adapte à la réputation des utilisateurs
- **Performance optimisée** : Architecture conçue pour une expérience fluide et réactive
- **Évolutivité** : Structure préparée pour l'ajout de nouvelles fonctionnalités

---

*Blinker - Partagez des moments qui comptent*
