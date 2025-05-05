# BlinkerAPI

## Configuration

Ce projet utilise des variables d'environnement pour sa configuration. Copiez le fichier `.env.example` en `.env` et ajustez les valeurs selon votre environnement.

### Variables d'environnement importantes

- `JWT_SECRET` : Clé secrète pour la génération des tokens JWT.
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, etc. : Configuration de la base de données.
- `API_URL` : URL du serveur API pour les ressources comme les uploads.
- `NODE_ENV` : Environnement (development, production).

### Gestion des URLs d'avatars

Le système utilise des URLs absolues pour les avatars, pointant directement vers le serveur API. Cela permet d'accéder aux fichiers d'uploads même si le frontend est servi sur un domaine ou port différent.

#### En développement local

En développement local, les URLs des avatars sont construites comme des URLs absolues pointant vers le serveur API local:

```
http://localhost:3011/uploads/filename.jpg
```

Configuration requise dans le fichier `.env` :
```
API_URL=http://localhost:3011
NODE_ENV=development
```

#### En production

En production, les URLs des avatars sont également construites comme des URLs absolues, mais pointant vers le serveur API de production:

```
https://dev.blinker.eterny.fr/uploads/filename.jpg
```

Configuration requise dans le fichier `.env` :
```
API_URL=https://dev.blinker.eterny.fr
NODE_ENV=production
```

#### Note sur la configuration Apache

Avec cette approche, vous n'avez pas besoin de configurer Apache pour rediriger les requêtes `/uploads/` vers le serveur API, car les URLs sont déjà absolues et pointent directement vers le serveur API.

Cependant, si vous rencontrez des problèmes de CORS (Cross-Origin Resource Sharing), vous devrez configurer le serveur API pour autoriser les requêtes provenant du domaine du frontend.

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur en mode développement
npm run dev

# Démarrer le serveur en mode production
npm start
```

## Tests

Le projet utilise Jest pour les tests unitaires et d'intégration. Pour exécuter les tests :

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests avec le mode watch (relance automatique des tests lors des modifications)
npm run test:watch

# Exécuter les tests avec la couverture de code
npm run test:coverage

# Exécuter les tests d'un domaine spécifique
npm run test:messages    # Tests liés aux messages
npm run test:conversations # Tests liés aux conversations
npm run test:auth        # Tests liés à l'authentification
npm run test:users       # Tests liés aux utilisateurs
```

Pour plus d'informations sur les tests, consultez la documentation dans le dossier `tests` :

- `tests/README.md` : Documentation générale sur les tests
- `tests/DOCUMENTATION.md` : Documentation détaillée sur les différents types de tests
- `tests/EXAMPLES.md` : Exemples de tests pour différentes parties de l'application
- `tests/BEST_PRACTICES.md` : Bonnes pratiques pour l'écriture de tests
- `tests/JEST_CONFIG.md` : Configuration de Jest pour le projet

## Branche DEV