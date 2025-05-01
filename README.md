# BlinkerAPI

## Configuration

Ce projet utilise des variables d'environnement pour sa configuration. Copiez le fichier `.env.example` en `.env` et ajustez les valeurs selon votre environnement.

### Variables d'environnement importantes

- `JWT_SECRET` : Clé secrète pour la génération des tokens JWT.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, etc. : Configuration de la base de données.
- `API_URL` : URL du serveur API (utilisé en développement local).
- `USE_ABSOLUTE_URL` : Utiliser des URLs absolues pour les uploads (true en développement, false en production).
- `NODE_ENV` : Environnement (development, production).

### Gestion des URLs d'avatars

Le système gère automatiquement les URLs des avatars en fonction de l'environnement :

#### En développement local

En développement local, les URLs des avatars sont construites comme des URLs absolues (ex: `http://localhost:3011/uploads/filename.jpg`). Cela permet d'accéder aux fichiers directement depuis le serveur API, même si le frontend est servi sur un port différent.

Configuration requise dans le fichier `.env` :
```
API_URL=http://localhost:3011
USE_ABSOLUTE_URL=true
NODE_ENV=development
```

#### En production

En production, les URLs des avatars sont construites comme des chemins relatifs (`/uploads/filename.jpg`). Pour que cela fonctionne correctement, vous devez configurer votre serveur web (Apache/Nginx) pour rediriger les requêtes vers le serveur API.

Configuration requise dans le fichier `.env` :
```
USE_ABSOLUTE_URL=false
NODE_ENV=production
```

#### Configuration Apache pour la production

Voici un exemple de configuration Apache pour rediriger les requêtes `/uploads/` vers le serveur API:

```apache
<VirtualHost *:443>
    ServerName app.dev.blinker.eterny.fr

    # Autres configurations...

    # Proxy pour les uploads vers le serveur API
    ProxyPass /uploads/ http://dev.blinker.eterny.fr/uploads/
    ProxyPassReverse /uploads/ http://dev.blinker.eterny.fr/uploads/

    # Autres configurations...
</VirtualHost>
```

Cette configuration permet au frontend d'accéder aux fichiers d'uploads directement depuis le serveur API, sans avoir à modifier le code pour gérer les URLs absolues.

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