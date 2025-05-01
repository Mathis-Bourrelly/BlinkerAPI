# BlinkerAPI

## Configuration

Ce projet utilise des variables d'environnement pour sa configuration. Copiez le fichier `.env.example` en `.env` et ajustez les valeurs selon votre environnement.

### Variables d'environnement importantes

- `SERVER_URL` : URL du serveur (ex: http://localhost:3011). Cette variable est utilisée pour construire les URLs complètes des avatars et autres ressources.
- `JWT_SECRET` : Clé secrète pour la génération des tokens JWT.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, etc. : Configuration de la base de données.

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur en mode développement
npm run dev

# Démarrer le serveur en mode production
npm start
```

## Branche DEV