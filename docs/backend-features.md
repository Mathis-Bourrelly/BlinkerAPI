# Documentation Technique du Backend Blinker

## Table des matières
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Système de Score Utilisateur](#système-de-score-utilisateur)
4. [Système de Messagerie](#système-de-messagerie)
5. [Gestion des Profils](#gestion-des-profils)
6. [Variables d'Environnement](#variables-denvironnement)

## Introduction

Cette documentation présente les fonctionnalités principales du backend de l'application Blinker, avec un focus particulier sur les optimisations récentes apportées au système de score utilisateur.

## Architecture

Le backend de Blinker est construit avec Node.js et Express, utilisant PostgreSQL comme base de données relationnelle et Sequelize comme ORM. L'architecture suit un modèle MVC (Modèle-Vue-Contrôleur) adapté aux API REST.

### Structure des dossiers
- `/src` : Code source principal
  - `/core` : Fonctionnalités de base (connexion DB, middlewares, etc.)
  - `/models` : Définition des modèles de données
  - `/services` : Logique métier
  - `/repository` : Accès aux données
  - `/route` : Définition des routes API
- `/migrations` : Scripts de migration de base de données
- `/seeders` : Scripts de génération de données de test
- `/docs` : Documentation

## Système de Score Utilisateur

### Principe de fonctionnement

Le score d'un utilisateur est basé uniquement sur la performance de ses blinks (publications) et influence la durée de vie des messages privés. Plus le score est élevé, plus les messages envoyés par l'utilisateur restent disponibles longtemps.

### Calcul du score basé sur la durée de vie

Le score utilisateur est calculé comme la durée de vie moyenne de tous les blinks de l'utilisateur qui ont été supprimés :

1. **Stockage des données** :
   - Le score est stocké dans la table `Profiles`
   - Les durées de vie des blinks sont enregistrées dans la table `BlinkLifetimes`

2. **Calcul du score** :
   - Lorsqu'un blink est supprimé, sa durée de vie réelle (de la création à la suppression) est calculée en secondes
   - Le score de l'utilisateur est la moyenne des durées de vie de tous ses blinks supprimés
   - Si l'utilisateur n'a pas encore de blinks supprimés, le score est calculé à partir du temps restant estimé de ses blinks actifs

3. **Implémentation technique** :
```javascript
// Requête SQL pour calculer le score basé sur la durée de vie moyenne
const lifetimeData = await sequelize.query(`
    SELECT AVG(lifetime) as "averageLifetime"
    FROM "BlinkLifetimes"
    WHERE "userID" = :userID
`, {
    replacements: { userID },
    type: sequelize.QueryTypes.SELECT
});
```

4. **Mise à jour du score** : Le score est mis à jour lors d'événements spécifiques :
   - Suppression d'un blink (naturelle ou par expiration)
   - Création d'un nouveau blink
   - Mise à jour périodique (toutes les 12 heures)

### Interprétation du score

Le score représente la durée de vie moyenne des blinks de l'utilisateur en secondes :
- Un score de 86400 correspond à une durée de vie moyenne de 24 heures
- Un score plus élevé indique que les blinks de l'utilisateur restent visibles plus longtemps
- Le score minimum par défaut est de 86400 (24 heures)



## Système de Messagerie

### Architecture des conversations

Le système de messagerie utilise une architecture basée sur les conversations :
- Table `Conversations` : Stocke les informations sur les conversations (participants, dates)
- Table `Messages` : Stocke les messages avec référence à la conversation

### Durée de vie des messages

La durée de vie d'un message est calculée en fonction du score moyen des participants à la conversation :
```javascript
const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
const averageLifetime = Math.max(Math.round(averageScore), 86400); // 1 jour minimum
const expiresAt = new Date(Date.now() + averageLifetime * 1000);
```

### Suppression automatique

Les messages expirés sont automatiquement supprimés par une tâche CRON.

## Gestion des Profils

### URLs des avatars

Les URLs des avatars sont construites dynamiquement en fonction de l'environnement :
```javascript
// En développement: http://localhost:3011/uploads/avatar.jpg
// En production: https://dev.blinker.eterny.fr/uploads/avatar.jpg
```

## Variables d'Environnement

Les principales variables d'environnement utilisées par le backend sont :

```
# URL du serveur API pour les ressources comme les uploads
API_URL=http://localhost:3011

# Environnement (development, production)
NODE_ENV=development

# Intervalle de suppression automatique des données expirées (en ms)
AUTO_DELETE_INTERVAL=300000
```

---

Document mis à jour le : 12 juin 2024
