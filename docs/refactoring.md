# Refactoring du Code

Ce document décrit les refactorisations effectuées pour améliorer la qualité du code, réduire la duplication et standardiser les patterns.

## 1. Utilitaire de Construction d'URL

### Fichier: `src/utils/url.utils.js`

Un module utilitaire a été créé pour centraliser la construction des URLs, notamment pour les avatars. Cela élimine la duplication de code dans plusieurs services.

```javascript
function buildAvatarUrl(filename) {
    if (!filename) return null;

    const apiUrl = process.env.API_URL ||
                  (process.env.NODE_ENV === 'production' ?
                   'https://dev.blinker.eterny.fr' :
                   'http://localhost:3011');

    return `${apiUrl}/uploads/${filename}`;
}
```

### Services mis à jour:
- `ProfilesService`
- `BlinkService`
- `ConversationService`

## 2. Utilitaire de Gestion des Erreurs

### Fichier: `src/utils/error.utils.js`

Un module utilitaire a été créé pour standardiser la gestion des erreurs et fournir des fonctions réutilisables.

```javascript
function createError(errorCode, originalError = null) {
    const message = errorCode || ErrorCodes.Base.UnknownError;

    if (originalError) {
        console.error(`Erreur originale:`, originalError);
    }

    return { message };
}
```

### Fonction de Gestion des Transactions

```javascript
async function withTransaction(operation, sequelize, errorCode = ErrorCodes.Base.UnknownError) {
    const transaction = await sequelize.transaction();
    try {
        const result = await operation(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        throw createError(error.message || errorCode, error);
    }
}
```

### Services mis à jour:
- `BlinkService`
- `MessagesService`

## 3. Classe de Base pour les Repositories

### Fichier: `src/repository/base.repository.js`

Une classe de base a été créée pour les repositories afin de standardiser les opérations CRUD et réduire la duplication de code.

```javascript
class BaseRepository {
    constructor(model, errorCodes) {
        this.model = model;
        this.errorCodes = errorCodes;
    }

    async create(data, options = {}) { /* ... */ }
    async findById(id, options = {}) { /* ... */ }
    async findAll(options = {}) { /* ... */ }
    async update(id, data, options = {}) { /* ... */ }
    async delete(id, options = {}) { /* ... */ }
    async count(options = {}) { /* ... */ }
}
```

### Repositories mis à jour:
- `ProfilesRepository`
- `BlinkRepository`
- `MessagesRepository`
- `ConversationsRepository`
- `FollowsRepository`

## Avantages des Refactorisations

1. **Réduction de la duplication de code**: Les fonctionnalités communes sont centralisées dans des modules utilitaires.
2. **Standardisation des patterns**: Les opérations similaires suivent désormais le même pattern.
3. **Meilleure gestion des erreurs**: Approche cohérente pour la création et la gestion des erreurs.
4. **Simplification des transactions**: Utilisation d'un wrapper pour les opérations avec transaction.
5. **Facilité de maintenance**: Les modifications futures seront plus simples à implémenter.
6. **Testabilité améliorée**: Le code est plus modulaire et donc plus facile à tester.

## Utilitaires de Pagination et Validation

### Fichier: `src/utils/pagination.utils.js`

Un module utilitaire a été créé pour standardiser la pagination dans toute l'application.

```javascript
function normalizePaginationParams({ page = 1, limit = 10, maxLimit = 100 }) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(maxLimit, Math.max(1, Number(limit) || 10));

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        offset: calculateOffset(normalizedPage, normalizedLimit)
    };
}

function formatPaginatedResponse({ page, limit, total, data }) {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        data
    };
}
```

### Fichier: `src/utils/validation.utils.js`

Un module utilitaire a été créé pour standardiser la validation des données.

```javascript
function validate(validations) {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const formattedErrors = errors.array().map(error => ({
            field: error.param,
            message: error.msg
        }));

        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: formattedErrors
        });
    };
}
```

## Utilisation des Utilitaires dans les Routes

Les utilitaires de pagination et validation ont été intégrés dans les routes pour standardiser la validation des données et la pagination.

### Exemple de Route Refactorisée

```javascript
router.post('/',
    AuthMiddleware.verifyToken,
    validate([
        body('contents').isArray().withMessage('Le contenu doit être un tableau'),
        body('contents.*.contentType').isIn(['text', 'image', 'video']).withMessage('Type de contenu invalide'),
        body('contents.*.content').notEmpty().withMessage('Le contenu ne peut pas être vide'),
        body('contents.*.position').isInt({ min: 0 }).withMessage('La position doit être un entier positif')
    ]),
    async (req, res, next) => {
        try {
            const { contents } = req.body;
            const userID = req.user.userID;

            const blink = await BlinkService.createBlinkWithContent({ userID, contents });
            return res.status(201).json(blink);
        } catch (error) {
            next(error);
        }
    }
);
```

### Utilisation de la Pagination Standardisée

```javascript
router.get("/",
    AuthMiddleware.verifyToken,
    async (req, res, next) => {
        try {
            const { page = 1, limit = 10, userId } = normalizePaginationParams(req.query);
            const result = await BlinkService.getPaginatedBlinks(page, limit, userId || null, req.user.userID);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);
```

## Tests Unitaires pour les Utilitaires

Des tests unitaires ont été ajoutés pour tous les utilitaires afin de garantir leur bon fonctionnement:

- `tests/utils/url.utils.test.js`
- `tests/utils/validation.utils.test.js`
- `tests/utils/pagination.utils.test.js`
- `tests/utils/error.utils.test.js`
- `tests/utils/response.utils.test.js`

Ces tests vérifient le comportement attendu de chaque fonction et couvrent les cas d'utilisation normaux et les cas limites.

## Standardisation des Réponses API

Un nouvel utilitaire a été créé pour standardiser les réponses API:

### Fichier: `src/utils/response.utils.js`

```javascript
function successResponse({ data, message = 'Opération réussie', status = 200 }) {
    return {
        success: true,
        status,
        message,
        data
    };
}

function errorResponse({ message, errors = null, status = 400 }) {
    return {
        success: false,
        status,
        message,
        errors
    };
}

function withStandardResponse(handler) {
    return async (req, res, next) => {
        try {
            const result = await handler(req, res, next);

            // Si la réponse a déjà été envoyée, ne rien faire
            if (res.headersSent) {
                return;
            }

            // Envoyer une réponse standardisée
            const response = successResponse({
                data: result,
                status: res.statusCode || 200
            });

            return res.status(response.status).json(response);
        } catch (error) {
            // Passer l'erreur au middleware de gestion d'erreurs
            next(error);
        }
    };
}
```

### Exemple d'Utilisation dans les Routes

```javascript
router.get('/search',
    AuthMiddleware.verifyToken,
    validate([
        body('query').notEmpty().withMessage("Le paramètre 'query' est requis.")
    ]),
    withStandardResponse(async (req) => {
        const { query } = req.query;
        const { page = 1, limit = 10 } = normalizePaginationParams(req.query);

        return await BlinkService.searchBlinksAndUsers(query, page, limit);
    })
);
```

## Système de Journalisation Standardisé

Un système de journalisation standardisé a été implémenté pour améliorer le débogage et la surveillance de l'application.

### Fichier: `src/utils/logger.utils.js`

```javascript
const winston = require('winston');

// Définir les niveaux de journalisation personnalisés
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Créer l'instance de logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports,
});

/**
 * Middleware pour journaliser les requêtes HTTP
 */
const httpLogger = (req, res, next) => {
    // Journaliser la requête
    logger.http(`${req.method} ${req.url}`);

    // Enregistrer l'heure de début
    const start = Date.now();

    // Une fois la réponse envoyée, journaliser le temps de réponse
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(
            `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
        );
    });

    next();
};
```

### Intégration dans l'Application

Le système de journalisation a été intégré dans l'application via le fichier `web-server.js`:

```javascript
constructor() {
    this.app = express();

    // Ajouter le middleware de journalisation HTTP
    this.app.use(httpLogger);

    initializeConfigMiddlewares(this.app);
    this._initializeRoutes();
    this._initializeErrorHandler();

    logger.info('Application initialisée');
}
```

## Refactorisation des Routes

Les routes ont été refactorisées pour utiliser les utilitaires de validation, pagination et réponse standardisée.

### Exemple de Route Utilisateurs Refactorisée

```javascript
router.get('/search',
    AuthMiddleware.verifyToken,
    validate([
        body('query').notEmpty().withMessage('Le paramètre "query" est requis')
    ]),
    withStandardResponse(async (req) => {
        const { query } = req.query;
        const { page, limit } = normalizePaginationParams(req.query);

        return await UsersService.searchUsers(query, page, limit);
    })
);
```

## Refactorisation des Routes Supplémentaires

D'autres routes ont été refactorisées pour utiliser les utilitaires de validation, pagination et réponse standardisée.

### Route des Messages

```javascript
router.post('/',
    AuthMiddleware.verifyToken,
    validate([
        body('content').notEmpty().withMessage('Le contenu du message est requis'),
        body('receiverID').optional().custom(value => {
            if (value && !isValidUUID(value)) {
                throw new Error('ID de destinataire invalide');
            }
            return true;
        }),
        body('conversationID').optional().custom(value => {
            if (value && !isValidUUID(value)) {
                throw new Error('ID de conversation invalide');
            }
            return true;
        }),
        body().custom(value => {
            if (!value.receiverID && !value.conversationID) {
                throw new Error('receiverID ou conversationID est requis');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const { receiverID, content, conversationID } = req.body;
        const userID = req.user.userID;

        logger.info(`Envoi d'un message de ${userID} à ${receiverID || 'conversation ' + conversationID}`);

        const message = await MessagesService.sendMessage(userID, receiverID, content, conversationID);
        return { message, status: 201 };
    })
);
```

### Route des Conversations

```javascript
router.get('/:conversationID',
    AuthMiddleware.verifyToken,
    validate([
        param('conversationID').custom(value => {
            if (!isValidUUID(value)) {
                throw new Error('ID conversation invalide');
            }
            return true;
        })
    ]),
    withStandardResponse(async (req) => {
        const userID = req.user.userID;
        const conversationID = req.params.conversationID;

        const conversation = await ConversationService.findConversationById(conversationID);

        if (!conversation) {
            const error = new Error('Conversation non trouvée');
            error.status = 404;
            throw error;
        }

        if (!conversation.participants.includes(userID)) {
            const error = new Error('Accès non autorisé à cette conversation');
            error.status = 403;
            throw error;
        }

        return conversation;
    })
);
```

## Tests d'Intégration

Des tests d'intégration ont été ajoutés pour vérifier le bon fonctionnement des routes refactorisées.

```javascript
describe('Messages Routes (Standardized)', () => {
  let app;

  // Configurer l'application Express avant chaque test
  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock du middleware d'authentification
    AuthMiddleware.verifyToken.mockImplementation((req, res, next) => {
      req.user = { userID: 'test-user-id', role: 'user' };
      next();
    });

    // Initialiser les routes
    app.use('/messages', messagesRoutes.initializeRoutes());
  });

  describe('POST /messages', () => {
    it('devrait envoyer un message et retourner une réponse standardisée', async () => {
      // Test avec réponse standardisée
      const response = await request(app)
        .post('/messages')
        .send({
          receiverID: 'receiver-user-id',
          content: 'Hello'
        })
        .expect(201);

      // Vérifier le format de réponse standardisé
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    });
  });
});
```

## Refactorisation des Routes

Toutes les routes de l'application ont été refactorisées pour utiliser les utilitaires de validation, pagination et réponse standardisée :

- `login.route.standardized.js` - Routes d'authentification
- `users.route.standardized.js` - Gestion des utilisateurs
- `profiles.route.standardized.js` - Profils utilisateurs
- `follows.route.standardized.js` - Relations de suivi
- `blinks.route.standardized.js` - Publications éphémères
- `messages.route.standardized.js` - Messagerie privée
- `conversations.route.standardized.js` - Conversations
- `interactions.route.standardized.js` - Likes et interactions

Ces routes standardisées remplacent les routes originales tout en conservant les mêmes chemins d'accès, assurant ainsi une transition transparente pour les clients existants.

```javascript
// Route de login standardisée
this.app.use("/", loginRouteStd.initializeRoutes());

// Autres routes standardisées
this.app.use("/users", usersRouteStd.initializeRoutes());
this.app.use("/follows", followsRouteStd.initializeRoutes());
this.app.use("/profiles", profilesRouteStd.initializeRoutes());
this.app.use("/blinks", blinksRouteStd.initializeRoutes());
this.app.use("/messages", messagesRouteStd.initializeRoutes());
this.app.use("/conversations", conversationsRouteStd.initializeRoutes());
this.app.use("/interactions", interactionsRouteStd.initializeRoutes());
```

## Documentation API avec Swagger

La documentation Swagger existante a été mise à jour pour refléter les réponses standardisées :

### Mise à jour des schémas

Les schémas de réponses standardisées ont été ajoutés au fichier `docs/swagger/schemas/index.yaml` :

```yaml
components:
  schemas:
    StandardResponse:
      type: object
      properties:
        success:
          type: boolean
          description: Indique si la requête a réussi
          example: true
        status:
          type: integer
          description: Code de statut HTTP
          example: 200
        message:
          type: string
          description: Message décrivant le résultat de l'opération
          example: "Opération réussie"
        data:
          type: object
          description: Données retournées par l'API
```

### Mise à jour des chemins

Les fichiers de chemins ont été mis à jour pour utiliser les réponses standardisées :

```yaml
responses:
  '200':
    description: Profil récupéré avec succès
    content:
      application/json:
        schema:
          allOf:
            - $ref: '#/components/schemas/StandardResponse'
            - type: object
              properties:
                data:
                  $ref: '#/components/schemas/Profile'
```

### Intégration avec la structure existante

Le fichier `swagger.js` a été mis à jour pour utiliser la structure existante dans `docs/swagger` :

```javascript
function loadSwaggerSpec() {
    // Créer une copie de la spécification principale
    const fullSpec = { ...mainSpec };

    // Ajouter les chemins
    for (const file of pathFiles) {
        const filePath = path.join(pathsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const pathSpec = YAML.parse(content);

        if (pathSpec.paths) {
            Object.assign(fullSpec.paths, pathSpec.paths);
        }
    }

    // Ajouter les schémas
    for (const file of schemaFiles) {
        const filePath = path.join(schemasDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const schemaSpec = YAML.parse(content);

        if (schemaSpec.components && schemaSpec.components.schemas) {
            Object.assign(fullSpec.components.schemas, schemaSpec.components.schemas);
        }
    }

    return fullSpec;
}
```

## Prochaines Étapes

1. Implémenter un système de cache pour améliorer les performances.
2. Ajouter des métriques de performance pour surveiller l'application.
3. Ajouter des tests d'intégration pour les routes standardisées.
4. Continuer à améliorer la documentation Swagger en utilisant la structure existante dans `docs/swagger`.
