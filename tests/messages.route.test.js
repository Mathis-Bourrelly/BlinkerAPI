/**
 * Tests unitaires pour le contrôleur de messages
 * Ces tests vérifient que les routes de messages fonctionnent correctement
 */

const express = require('express');
const request = require('supertest');
const MessagesService = require('../src/services/messages.service');
const ConversationService = require('../src/services/conversations.service');
const AuthMiddleware = require('../src/core/middlewares/authMiddleware');
const messagesRoutes = require('../src/route/OLD/messages.route');

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
      
      expect(response.body).toHaveProperty('error', 'Conversation non trouvée');
    });

    it('devrait retourner une erreur 403 si l\'utilisateur n\'est pas participant à la conversation', async () => {
      // Configurer les mocks
      const conversationID = 'test-conversation-id';
      const mockConversation = {
        conversationID,
        participants: ['other-user-id-1', 'other-user-id-2']
      };
      
      ConversationService.findConversationById.mockResolvedValue(mockConversation);

      // Effectuer la requête
      const response = await request(app)
        .get(`/messages/conversation/${conversationID}`)
        .expect(403);

      // Vérifier les résultats
      expect(ConversationService.findConversationById).toHaveBeenCalledWith(conversationID);
      expect(MessagesService.getConversationMessages).not.toHaveBeenCalled();
      
      expect(response.body).toHaveProperty('error', 'Vous n\'êtes pas autorisé à accéder à cette conversation');
    });
  });

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

    it('devrait retourner une erreur 400 si le contenu du message est manquant', async () => {
      // Effectuer la requête
      const response = await request(app)
        .post('/messages/send')
        .send({
          receiverID: 'receiver-user-id'
        })
        .expect(400);

      // Vérifier les résultats
      expect(MessagesService.sendMessage).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty('error', 'Le contenu du message est requis');
    });

    it('devrait retourner une erreur 400 si le destinataire est manquant', async () => {
      // Effectuer la requête
      const response = await request(app)
        .post('/messages/send')
        .send({
          content: 'Hello'
        })
        .expect(400);

      // Vérifier les résultats
      expect(MessagesService.sendMessage).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty('error', 'L\'ID du destinataire est requis');
    });
  });

  describe('GET /messages/unread', () => {
    it('devrait récupérer les messages non lus de l\'utilisateur', async () => {
      // Configurer les mocks
      const mockMessages = [
        {
          messageID: 'message-1',
          conversationID: 'conversation-1',
          content: 'Hello',
          senderID: 'other-user-id',
          createdAt: new Date(),
          isRead: false,
          get: jest.fn().mockReturnValue({
            messageID: 'message-1',
            conversationID: 'conversation-1',
            content: 'Hello',
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
      
      MessagesService.getUnreadMessages.mockResolvedValue(mockMessages);

      // Effectuer la requête
      const response = await request(app)
        .get('/messages/unread')
        .expect(200);

      // Vérifier les résultats
      expect(MessagesService.getUnreadMessages).toHaveBeenCalledWith('test-user-id');
      
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('messageID', 'message-1');
      expect(response.body[0]).toHaveProperty('content', 'Hello');
      expect(response.body[0]).toHaveProperty('sender');
      expect(response.body[0].sender).toHaveProperty('userID', 'other-user-id');
    });
  });
});
