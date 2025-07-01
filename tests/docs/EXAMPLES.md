# Exemples de tests pour BlinkerAPI

Ce document fournit des exemples de tests pour différentes parties de l'API Blinker. Ces exemples peuvent être utilisés comme référence pour écrire de nouveaux tests.

## Test de repository

Les tests de repository vérifient que les opérations CRUD sur la base de données fonctionnent correctement.

### Exemple : Test de récupération de messages

```javascript
/**
 * Tests unitaires pour le repository de messages
 */
const MessagesRepository = require('./messages.repository');
const {sequelize} = require('./postgres');

describe('MessagesRepository', () => {
    // Avant tous les tests, vérifier que la base de données est accessible
    beforeAll(async () => {
        try {
            await sequelize.authenticate();
            console.log('Connexion à la base de données établie avec succès.');
        } catch (error) {
            console.error('Impossible de se connecter à la base de données:', error);
            throw error;
        }
    });

    // Après tous les tests, fermer la connexion à la base de données
    afterAll(async () => {
        await sequelize.close();
    });

    describe('getConversationMessages', () => {
        it('devrait récupérer les messages avec les informations de l\'expéditeur', async () => {
            // Récupérer une conversation existante pour le test
            const conversations = await sequelize.query(
                "SELECT \"conversationID\" FROM \"Conversations\" LIMIT 1",
                {type: sequelize.QueryTypes.SELECT}
            );

            if (conversations.length === 0) {
                console.log('Aucune conversation trouvée pour le test');
                return;
            }

            const conversationID = conversations[0].conversationID;

            // Récupérer les messages de la conversation
            const messages = await MessagesRepository.getConversationMessages(conversationID);

            // Vérifier que des messages ont été récupérés
            expect(messages.length).toBeGreaterThan(0);

            // Vérifier que chaque message a un senderID
            messages.forEach(message => {
                expect(message.senderID).toBeDefined();
                expect(message.senderID).not.toBeNull();
            });

            // Vérifier que chaque message a un objet sender avec userID et email
            messages.forEach(message => {
                expect(message.sender).toBeDefined();
                expect(message.sender.userID).toBeDefined();
                expect(message.sender.email).toBeDefined();

                // Vérifier que le userID dans sender correspond au senderID du message
                expect(message.sender.userID).toBe(message.senderID);
            });
        });
    });
});
```

### Exemple : Test de création de message

```javascript
describe('MessagesRepository', () => {
  // ... configuration ...

  describe('createMessage', () => {
    it('devrait créer un nouveau message', async () => {
      // Données de test
      const messageData = {
        conversationID: 'test-conversation-id',
        senderID: 'test-sender-id',
        content: 'Test message'
      };
      
      // Créer un mock pour la méthode create de Messages
      const createMock = jest.spyOn(Messages, 'create').mockResolvedValue({
        messageID: 'test-message-id',
        ...messageData,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isRead: false
      });
      
      // Appeler la méthode à tester
      const result = await MessagesRepository.createMessage(messageData);
      
      // Vérifier que la méthode create a été appelée avec les bonnes données
      expect(createMock).toHaveBeenCalledWith({
        ...messageData,
        expiresAt: expect.any(Date),
        isRead: false
      });
      
      // Vérifier le résultat
      expect(result).toHaveProperty('messageID', 'test-message-id');
      expect(result).toHaveProperty('conversationID', 'test-conversation-id');
      expect(result).toHaveProperty('senderID', 'test-sender-id');
      expect(result).toHaveProperty('content', 'Test message');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('isRead', false);
      
      // Restaurer le mock
      createMock.mockRestore();
    });
  });
});
```

## Test de service

Les tests de service vérifient la logique métier de l'application.

### Exemple : Test de création de conversation

```javascript
/**
 * Tests unitaires pour le service de conversations
 */
const ConversationService = require('../src/services/conversations.service');
const ConversationsRepository = require('../src/repository/conversations.repository');
const MessagesRepository = require('../src/repository/messages.repository');

// Mock pour les repositories
jest.mock('../src/repository/conversations.repository');
jest.mock('../src/repository/messages.repository');

describe('ConversationService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('devrait créer une nouvelle conversation si elle n\'existe pas déjà', async () => {
      // Configurer les mocks
      ConversationsRepository.findAll.mockResolvedValue([]);
      ConversationsRepository.createConversation.mockResolvedValue({
        conversationID: 'test-conversation-id',
        participants: ['user1', 'user2']
      });

      // Appeler la méthode à tester
      const result = await ConversationService.createConversation(['user1', 'user2']);

      // Vérifier les résultats
      expect(ConversationsRepository.findAll).toHaveBeenCalled();
      expect(ConversationsRepository.createConversation).toHaveBeenCalledWith(['user1', 'user2']);
      expect(result).toEqual({
        conversationID: 'test-conversation-id',
        participants: ['user1', 'user2']
      });
    });

    it('devrait retourner une conversation existante si elle existe déjà', async () => {
      // Configurer les mocks
      const existingConversation = {
        conversationID: 'existing-conversation-id',
        participants: ['user1', 'user2']
      };
      ConversationsRepository.findAll.mockResolvedValue([existingConversation]);

      // Appeler la méthode à tester
      const result = await ConversationService.createConversation(['user1', 'user2']);

      // Vérifier les résultats
      expect(ConversationsRepository.findAll).toHaveBeenCalled();
      expect(ConversationsRepository.createConversation).not.toHaveBeenCalled();
      expect(result).toEqual(existingConversation);
    });

    it('devrait lever une erreur si moins de 2 participants sont fournis', async () => {
      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ConversationService.createConversation(['user1']))
        .rejects.toThrow('Une conversation doit avoir au moins 2 participants');
      
      // Vérifier que les méthodes du repository n'ont pas été appelées
      expect(ConversationsRepository.findAll).not.toHaveBeenCalled();
      expect(ConversationsRepository.createConversation).not.toHaveBeenCalled();
    });
  });
});
```

### Exemple : Test de récupération des conversations d'un utilisateur

```javascript
describe('ConversationService', () => {
  // ... configuration ...

  describe('getUserConversations', () => {
    it('devrait récupérer toutes les conversations d\'un utilisateur avec les détails', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const otherUserID = 'other-user-id';
      const conversationID = 'test-conversation-id';
      
      ConversationsRepository.findByParticipant.mockResolvedValue([
        {
          conversationID,
          participants: [userID, otherUserID]
        }
      ]);
      
      ConversationsRepository.getParticipantProfile.mockResolvedValue({
        userID: otherUserID,
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'avatar.jpg'
      });
      
      MessagesRepository.getLastMessage.mockResolvedValue({
        content: 'Hello',
        createdAt: new Date(),
        isRead: false
      });
      
      MessagesRepository.countUnreadMessages.mockResolvedValue(2);

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ConversationService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://localhost:3011/uploads/avatar.jpg');

      // Appeler la méthode à tester
      const result = await ConversationService.getUserConversations(userID);

      // Vérifier les résultats
      expect(ConversationsRepository.findByParticipant).toHaveBeenCalledWith(userID);
      expect(ConversationsRepository.getParticipantProfile).toHaveBeenCalledWith(otherUserID);
      expect(MessagesRepository.getLastMessage).toHaveBeenCalledWith(conversationID);
      expect(MessagesRepository.countUnreadMessages).toHaveBeenCalledWith(conversationID);
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('avatar.jpg');
      
      expect(result).toEqual([
        {
          conversationID,
          userID: otherUserID,
          username: 'testuser',
          display_name: 'Test User',
          avatar_url: 'http://localhost:3011/uploads/avatar.jpg',
          lastMessage: {
            content: 'Hello',
            createdAt: expect.any(Date),
            read: false
          },
          unreadCount: 2
        }
      ]);

      // Restaurer l'espion
      buildAvatarUrlSpy.mockRestore();
    });
  });
});
```

## Test de contrôleur

Les tests de contrôleur vérifient que les requêtes HTTP sont correctement traitées et que les réponses sont conformes aux attentes.

### Exemple : Test de transformation des objets Sequelize

```javascript
/**
 * Tests unitaires pour le contrôleur de messages
 */
const MessagesService = require('../src/services/messages.service');
const ConversationService = require('../src/services/conversations.service');
const messagesRoutes = require('../src/route/messages.route');

// Mocks pour les dépendances
jest.mock('../src/services/messages.service');
jest.mock('../src/services/conversations.service');

describe('Messages Controller', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait transformer les objets Sequelize en objets JavaScript simples', async () => {
      // Créer un mock pour un objet Sequelize
      const mockSequelizeObject = {
        messageID: 'test-message-id',
        conversationID: 'test-conversation-id',
        content: 'Test message',
        senderID: 'test-sender-id',
        sender: {
          userID: 'test-sender-id',
          email: 'test@example.com'
        },
        get: jest.fn().mockImplementation(({ plain }) => {
          if (plain) {
            return {
              messageID: 'test-message-id',
              conversationID: 'test-conversation-id',
              content: 'Test message',
              senderID: 'test-sender-id',
              sender: {
                userID: 'test-sender-id',
                email: 'test@example.com'
              }
            };
          }
        })
      };

      // Configurer les mocks
      ConversationService.findConversationById.mockResolvedValue({
        conversationID: 'test-conversation-id',
        participants: ['test-user-id', 'test-sender-id']
      });
      MessagesService.getConversationMessages.mockResolvedValue([mockSequelizeObject]);

      // Créer la requête et la réponse
      const req = {
        params: { conversationID: 'test-conversation-id' },
        user: { userID: 'test-user-id' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Extraire la fonction de route
      const routeHandler = messagesRoutes.initializeRoutes().stack.find(
        layer => layer.route && layer.route.path === '/conversation/:conversationID' && layer.route.methods.get
      ).route.stack[1].handle;

      // Appeler la fonction de route
      await routeHandler(req, res);

      // Vérifier que la méthode get a été appelée avec { plain: true }
      expect(mockSequelizeObject.get).toHaveBeenCalledWith({ plain: true });

      // Vérifier que res.json a été appelé avec un tableau d'objets JavaScript simples
      expect(res.json).toHaveBeenCalledWith([{
        messageID: 'test-message-id',
        conversationID: 'test-conversation-id',
        content: 'Test message',
        senderID: 'test-sender-id',
        sender: {
          userID: 'test-sender-id',
          email: 'test@example.com'
        }
      }]);
    });
  });
});
```

## Test de route

Les tests de route vérifient que les routes HTTP fonctionnent correctement de bout en bout.

### Exemple : Test de récupération des messages d'une conversation

```javascript
/**
 * Tests unitaires pour les routes de messages
 */
const express = require('express');
const request = require('supertest');
const MessagesService = require('../src/services/messages.service');
const ConversationService = require('../src/services/conversations.service');
const AuthMiddleware = require('../src/core/middlewares/authMiddleware');
const messagesRoutes = require('../src/route/messages.route');

// Mocks pour les dépendances
jest.mock('../src/services/messages.service');
jest.mock('../src/services/conversations.service');
jest.mock('../src/core/middlewares/authMiddleware');

describe('Messages Routes', () => {
  let app;

  // Configurer l'application Express avant chaque test
  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock du middleware d'authentification
    AuthMiddleware.verifyToken.mockImplementation((req, res, next) => {
      req.user = { userID: 'test-user-id' };
      next();
    });
    
    // Initialiser les routes
    app.use('/messages', messagesRoutes.initializeRoutes());
  });

  // Réinitialiser les mocks après chaque test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait récupérer les messages d\'une conversation', async () => {
      // Configurer les mocks
      const conversationID = 'test-conversation-id';
      const mockConversation = {
        conversationID,
        participants: ['test-user-id', 'other-user-id']
      };
      
      const mockMessages = [
        {
          messageID: 'message-1',
          conversationID,
          content: 'Hello',
          senderID: 'test-user-id',
          createdAt: new Date(),
          isRead: true,
          get: jest.fn().mockReturnValue({
            messageID: 'message-1',
            conversationID,
            content: 'Hello',
            senderID: 'test-user-id',
            createdAt: new Date(),
            isRead: true,
            sender: {
              userID: 'test-user-id',
              email: 'test@example.com'
            }
          })
        },
        {
          messageID: 'message-2',
          conversationID,
          content: 'Hi there',
          senderID: 'other-user-id',
          createdAt: new Date(),
          isRead: false,
          get: jest.fn().mockReturnValue({
            messageID: 'message-2',
            conversationID,
            content: 'Hi there',
            senderID: 'other-user-id',
            createdAt: new Date(),
            isRead: false,
            sender: {
              userID: 'other-user-id',
              email: 'other@example.com'
            }
          })
        }
      ];
      
      ConversationService.findConversationById.mockResolvedValue(mockConversation);
      MessagesService.getConversationMessages.mockResolvedValue(mockMessages);

      // Effectuer la requête
      const response = await request(app)
        .get(`/messages/conversation/${conversationID}`)
        .expect(200);

      // Vérifier les résultats
      expect(ConversationService.findConversationById).toHaveBeenCalledWith(conversationID);
      expect(MessagesService.getConversationMessages).toHaveBeenCalledWith(conversationID);
      
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('messageID', 'message-1');
      expect(response.body[0]).toHaveProperty('content', 'Hello');
      expect(response.body[0]).toHaveProperty('sender');
      expect(response.body[0].sender).toHaveProperty('userID', 'test-user-id');
      
      expect(response.body[1]).toHaveProperty('messageID', 'message-2');
      expect(response.body[1]).toHaveProperty('content', 'Hi there');
      expect(response.body[1]).toHaveProperty('sender');
      expect(response.body[1].sender).toHaveProperty('userID', 'other-user-id');
    });
  });
});
```

### Exemple : Test d'envoi de message

```javascript
describe('Messages Routes', () => {
  // ... configuration ...

  describe('POST /messages/send', () => {
    it('devrait envoyer un message à un utilisateur', async () => {
      // Configurer les mocks
      const mockMessage = {
        messageID: 'new-message-id',
        conversationID: 'test-conversation-id',
        content: 'Hello',
        senderID: 'test-user-id',
        receiverID: 'receiver-user-id',
        createdAt: new Date(),
        isRead: false
      };
      
      MessagesService.sendMessage.mockResolvedValue(mockMessage);

      // Effectuer la requête
      const response = await request(app)
        .post('/messages/send')
        .send({
          receiverID: 'receiver-user-id',
          content: 'Hello'
        })
        .expect(201);

      // Vérifier les résultats
      expect(MessagesService.sendMessage).toHaveBeenCalledWith(
        'test-user-id',
        'receiver-user-id',
        'Hello',
        null
      );
      
      expect(response.body).toEqual(mockMessage);
    });
  });
});
```

## Test de middleware

Les tests de middleware vérifient que les middlewares fonctionnent correctement.

### Exemple : Test de vérification de token

```javascript
/**
 * Tests unitaires pour le middleware d'authentification
 */
const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/core/middlewares/authMiddleware');
const userService = require('../src/services/users.service');

// Mocks pour les dépendances
jest.mock('jsonwebtoken');
jest.mock('../src/services/users.service');

describe('AuthMiddleware', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer l'environnement pour les tests
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('verifyToken', () => {
    it('devrait extraire le token et appeler next() si le token est valide', () => {
      // Configurer les mocks
      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      jwt.verify.mockReturnValue({
        userID: 'test-user-id',
        email: 'test@example.com'
      });

      // Appeler la méthode à tester
      authMiddleware.verifyToken(req, res, next);

      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual({
        userID: 'test-user-id',
        email: 'test@example.com'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
```

### Exemple : Test de vérification d'utilisateur

```javascript
describe('AuthMiddleware', () => {
  // ... configuration ...

  describe('checkVerifiedUser', () => {
    it('devrait appeler next() si l\'utilisateur est vérifié', async () => {
      // Configurer les mocks
      const req = {
        user: {
          userID: 'test-user-id'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      userService.getUserById.mockResolvedValue({
        userID: 'test-user-id',
        isVerified: true
      });

      // Appeler la méthode à tester
      await authMiddleware.checkVerifiedUser(req, res, next);

      // Vérifier les résultats
      expect(userService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
```

## Conclusion

Ces exemples montrent comment écrire des tests pour différentes parties de l'API Blinker. Ils peuvent être utilisés comme référence pour écrire de nouveaux tests. N'hésitez pas à adapter ces exemples à vos besoins spécifiques.
