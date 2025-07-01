/**
 * Tests d'intégration pour les routes de messages standardisées
 */
const express = require('express');
const request = require('supertest');
const MessagesService = require('../../src/services/messages.service');
const ConversationService = require('../../src/services/conversations.service');
const AuthMiddleware = require('../../src/core/middlewares/authMiddleware');
const messagesRoutes = require('../../src/route/messages.route.standardized');

// Mocks pour les dépendances
jest.mock('../../src/services/messages.service');
jest.mock('../../src/services/conversations.service');
jest.mock('../../src/core/middlewares/authMiddleware');
jest.mock('../../src/utils/logger.utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  httpLogger: jest.fn((req, res, next) => next())
}));

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

  // Réinitialiser les mocks après chaque test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /messages', () => {
    it('devrait envoyer un message et retourner une réponse standardisée', async () => {
      // Configurer les mocks
      const mockMessage = {
        messageID: 'new-message-id',
        conversationID: 'test-conversation-id',
        content: 'Hello',
        senderID: 'test-user-id',
        createdAt: new Date(),
        isRead: false
      };
      
      MessagesService.sendMessage.mockResolvedValue(mockMessage);

      // Effectuer la requête
      const response = await request(app)
        .post('/messages')
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
      
      // Vérifier le format de réponse standardisé
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('message', mockMessage);
    });

    it('devrait retourner une erreur 400 si les données sont invalides', async () => {
      // Effectuer la requête sans contenu
      const response = await request(app)
        .post('/messages')
        .send({
          receiverID: 'receiver-user-id'
          // Pas de contenu
        })
        .expect(400);

      // Vérifier le format de réponse standardisé pour les erreurs
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /messages/conversation/:conversationID', () => {
    it('devrait récupérer les messages d\'une conversation avec une réponse standardisée', async () => {
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
            isRead: true
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
            isRead: false
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
      
      // Vérifier le format de réponse standardisé
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('messageID', 'message-1');
      expect(response.body.data[1]).toHaveProperty('messageID', 'message-2');
    });

    it('devrait retourner une erreur 404 si la conversation n\'existe pas', async () => {
      // Configurer les mocks
      const conversationID = 'nonexistent-conversation-id';
      
      ConversationService.findConversationById.mockResolvedValue(null);

      // Effectuer la requête
      const response = await request(app)
        .get(`/messages/conversation/${conversationID}`)
        .expect(404);

      // Vérifier les résultats
      expect(ConversationService.findConversationById).toHaveBeenCalledWith(conversationID);
      expect(MessagesService.getConversationMessages).not.toHaveBeenCalled();
      
      // Vérifier le format de réponse standardisé pour les erreurs
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('message', 'Conversation non trouvée');
    });
  });

  describe('DELETE /messages/expired', () => {
    it('devrait permettre à un admin de supprimer les messages expirés', async () => {
      // Modifier le mock pour simuler un utilisateur admin
      AuthMiddleware.verifyToken.mockImplementationOnce((req, res, next) => {
        req.user = { userID: 'admin-user-id', role: 'admin' };
        next();
      });
      
      MessagesService.deleteExpiredMessages.mockResolvedValue(5); // 5 messages supprimés

      // Effectuer la requête
      const response = await request(app)
        .delete('/messages/expired')
        .expect(200);

      // Vérifier les résultats
      expect(MessagesService.deleteExpiredMessages).toHaveBeenCalled();
      
      // Vérifier le format de réponse standardisé
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('message', 'Messages expirés supprimés avec succès');
    });

    it('devrait refuser l\'accès à un utilisateur non-admin', async () => {
      // Effectuer la requête avec un utilisateur non-admin
      const response = await request(app)
        .delete('/messages/expired')
        .expect(403);

      // Vérifier les résultats
      expect(MessagesService.deleteExpiredMessages).not.toHaveBeenCalled();
      
      // Vérifier le format de réponse standardisé pour les erreurs
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('status', 403);
      expect(response.body).toHaveProperty('message', 'Accès non autorisé');
    });
  });
});
