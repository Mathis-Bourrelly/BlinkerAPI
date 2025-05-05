# Documentation des tests pour BlinkerAPI

## Introduction

Cette documentation détaille les différents types de tests implémentés dans l'API Blinker, leur objectif, leur structure et les meilleures pratiques à suivre pour les maintenir et en ajouter de nouveaux.

## Types de tests

### Tests unitaires

Les tests unitaires vérifient le bon fonctionnement d'une unité de code isolée (généralement une fonction ou une méthode). Ils sont rapides à exécuter et permettent de détecter rapidement les régressions.

**Exemples** :
- Tests des méthodes du repository de messages
- Tests des méthodes du service de conversations
- Tests des méthodes du service d'authentification

### Tests d'intégration

Les tests d'intégration vérifient que plusieurs unités de code fonctionnent correctement ensemble. Ils sont plus lents que les tests unitaires mais permettent de détecter des problèmes d'intégration entre les différentes parties de l'application.

**Exemples** :
- Tests des routes de messages qui intègrent le contrôleur, le service et le repository
- Tests du middleware d'authentification qui intègre le service d'utilisateurs

## Structure des tests

### Repository Tests

Les tests de repository vérifient que les opérations CRUD sur la base de données fonctionnent correctement.

**Exemple** : `messages.repository.test.js`

```javascript
describe('MessagesRepository', () => {
  // Tests de connexion à la base de données
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  // Fermeture de la connexion après les tests
  afterAll(async () => {
    await sequelize.close();
  });

  describe('getConversationMessages', () => {
    it('devrait récupérer les messages avec les informations de l\'expéditeur', async () => {
      // Test de récupération des messages
    });
  });
});
```

### Service Tests

Les tests de service vérifient la logique métier de l'application.

**Exemple** : `conversations.service.test.js`

```javascript
describe('ConversationService', () => {
  // Mock des dépendances
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('devrait créer une nouvelle conversation si elle n\'existe pas déjà', async () => {
      // Test de création de conversation
    });
  });
});
```

### Controller Tests

Les tests de contrôleur vérifient que les requêtes HTTP sont correctement traitées et que les réponses sont conformes aux attentes.

**Exemple** : `messages.controller.test.js`

```javascript
describe('Messages Controller', () => {
  // Mock des dépendances
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait transformer les objets Sequelize en objets JavaScript simples', async () => {
      // Test de transformation des objets
    });
  });
});
```

### Route Tests

Les tests de route vérifient que les routes HTTP fonctionnent correctement de bout en bout.

**Exemple** : `messages.route.test.js`

```javascript
describe('Messages Routes', () => {
  // Configuration de l'application Express
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/messages', messagesRoutes.initializeRoutes());
  });

  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait récupérer les messages d\'une conversation', async () => {
      // Test de récupération des messages via HTTP
    });
  });
});
```

### Middleware Tests

Les tests de middleware vérifient que les middlewares fonctionnent correctement.

**Exemple** : `auth.middleware.test.js`

```javascript
describe('AuthMiddleware', () => {
  // Mock des dépendances
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('devrait extraire le token et appeler next() si le token est valide', () => {
      // Test de vérification du token
    });
  });
});
```

## Mocking

Le mocking est une technique qui permet de remplacer les dépendances d'un module par des objets simulés pour isoler le code testé.

### Mocking des modules

```javascript
// Mock du module messages.service.js
jest.mock('./messages.service.js', () => ({
    getConversationMessages: jest.fn(),
    sendMessage: jest.fn(),
    getUnreadMessages: jest.fn()
}));
```

### Mocking des méthodes

```javascript
// Mock de la méthode findAll de Sequelize
Messages.findAll = jest.fn().mockResolvedValue([
  {
    messageID: 'test-message-id',
    content: 'Test message',
    senderID: 'test-sender-id'
  }
]);
```

### Mocking des objets Sequelize

```javascript
// Mock d'un objet Sequelize avec la méthode get
const mockSequelizeObject = {
  messageID: 'test-message-id',
  content: 'Test message',
  get: jest.fn().mockImplementation(({ plain }) => {
    if (plain) {
      return {
        messageID: 'test-message-id',
        content: 'Test message'
      };
    }
  })
};
```

## Assertions

Les assertions permettent de vérifier que le code testé produit les résultats attendus.

### Assertions de base

```javascript
// Vérifier l'égalité
expect(result).toBe('valeur attendue');

// Vérifier la structure d'un objet
expect(result).toEqual({
  id: 'test-id',
  name: 'test-name'
});

// Vérifier qu'une fonction a été appelée
expect(mockFunction).toHaveBeenCalled();

// Vérifier qu'une fonction a été appelée avec des arguments spécifiques
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
```

### Assertions pour les promesses

```javascript
// Vérifier qu'une promesse est résolue
await expect(promise).resolves.toBe('valeur attendue');

// Vérifier qu'une promesse est rejetée
await expect(promise).rejects.toThrow('message d\'erreur');
```

## Couverture de code

La couverture de code permet de mesurer la proportion du code qui est testée. Elle est calculée en exécutant les tests avec l'option `--coverage`.

```bash
npm run test:coverage
```

Le rapport de couverture indique :
- Le pourcentage de lignes de code testées
- Le pourcentage de branches testées (if/else, switch/case, etc.)
- Le pourcentage de fonctions testées
- Les lignes de code non testées

## Bonnes pratiques

### Organisation des tests

- Organisez les tests par domaine fonctionnel
- Utilisez des noms de fichiers descriptifs
- Utilisez des noms de tests descriptifs
- Utilisez `describe` pour regrouper les tests par fonctionnalité
- Utilisez `it` pour décrire le comportement attendu

### Isolation des tests

- Chaque test doit être indépendant des autres tests
- Utilisez `beforeEach` et `afterEach` pour initialiser et nettoyer l'environnement de test
- Utilisez des mocks pour isoler le code testé de ses dépendances
- Évitez les dépendances externes (API, base de données, etc.) dans les tests unitaires

### Tests asynchrones

- Utilisez `async/await` pour les tests asynchrones
- Assurez-vous que toutes les promesses sont résolues avant la fin du test
- Utilisez `try/catch` pour capturer les erreurs dans les tests asynchrones
- Utilisez `done` uniquement si nécessaire (préférez `async/await`)

### Maintenance des tests

- Mettez à jour les tests lorsque vous modifiez le code
- Exécutez les tests régulièrement
- Corrigez les tests qui échouent avant de continuer le développement
- Ajoutez de nouveaux tests pour les nouvelles fonctionnalités

## Exemples de tests

### Test de repository

```javascript
/**
 * Tests unitaires pour le repository de messages
 */
describe('MessagesRepository', () => {
  describe('getConversationMessages', () => {
    it('devrait récupérer les messages avec les informations de l\'expéditeur', async () => {
      // Arrangement
      const conversationID = 'test-conversation-id';
      
      // Action
      const messages = await MessagesRepository.getConversationMessages(conversationID);
      
      // Assertion
      expect(messages.length).toBeGreaterThan(0);
      messages.forEach(message => {
        expect(message.senderID).toBeDefined();
        expect(message.sender).toBeDefined();
        expect(message.sender.userID).toBe(message.senderID);
      });
    });
  });
});
```

### Test de service

```javascript
/**
 * Tests unitaires pour le service de conversations
 */
describe('ConversationService', () => {
  describe('createConversation', () => {
    it('devrait créer une nouvelle conversation si elle n\'existe pas déjà', async () => {
      // Arrangement
      ConversationsRepository.findAll.mockResolvedValue([]);
      ConversationsRepository.createConversation.mockResolvedValue({
        conversationID: 'test-conversation-id',
        participants: ['user1', 'user2']
      });
      
      // Action
      const result = await ConversationService.createConversation(['user1', 'user2']);
      
      // Assertion
      expect(ConversationsRepository.findAll).toHaveBeenCalled();
      expect(ConversationsRepository.createConversation).toHaveBeenCalledWith(['user1', 'user2']);
      expect(result).toEqual({
        conversationID: 'test-conversation-id',
        participants: ['user1', 'user2']
      });
    });
  });
});
```

### Test de contrôleur

```javascript
/**
 * Tests unitaires pour le contrôleur de messages
 */
describe('Messages Controller', () => {
  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait transformer les objets Sequelize en objets JavaScript simples', async () => {
      // Arrangement
      const mockSequelizeObject = {
        messageID: 'test-message-id',
        get: jest.fn().mockReturnValue({
          messageID: 'test-message-id',
          content: 'Test message'
        })
      };
      MessagesService.getConversationMessages.mockResolvedValue([mockSequelizeObject]);
      
      // Action
      await messagesController.getConversationMessages(req, res);
      
      // Assertion
      expect(mockSequelizeObject.get).toHaveBeenCalledWith({ plain: true });
      expect(res.json).toHaveBeenCalledWith([{
        messageID: 'test-message-id',
        content: 'Test message'
      }]);
    });
  });
});
```

### Test de route

```javascript
/**
 * Tests unitaires pour les routes de messages
 */
describe('Messages Routes', () => {
  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait récupérer les messages d\'une conversation', async () => {
      // Arrangement
      const conversationID = 'test-conversation-id';
      ConversationService.findConversationById.mockResolvedValue({
        conversationID,
        participants: ['test-user-id', 'other-user-id']
      });
      MessagesService.getConversationMessages.mockResolvedValue([
        {
          messageID: 'message-1',
          content: 'Hello',
          get: jest.fn().mockReturnValue({
            messageID: 'message-1',
            content: 'Hello'
          })
        }
      ]);
      
      // Action
      const response = await request(app)
        .get(`/messages/conversation/${conversationID}`)
        .expect(200);
      
      // Assertion
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('messageID', 'message-1');
      expect(response.body[0]).toHaveProperty('content', 'Hello');
    });
  });
});
```

## Conclusion

Les tests sont essentiels pour garantir la qualité et la fiabilité de l'application. Ils permettent de détecter rapidement les régressions et facilitent la maintenance du code. En suivant les bonnes pratiques décrites dans cette documentation, vous pourrez créer des tests efficaces et maintenables pour l'API Blinker.
