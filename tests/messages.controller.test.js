/**
 * Tests unitaires pour le contrôleur de messages
 * Ces tests vérifient que les objets Sequelize sont correctement transformés en objets JavaScript simples
 */

// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

// Mocks pour Express
const mockRequest = () => {
  const req = {};
  req.body = jest.fn().mockReturnValue(req);
  req.params = jest.fn().mockReturnValue(req);
  req.user = { userID: 'test-user-id' };
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock pour le service de messages
jest.mock('../src/services/messages.service.js', () => ({
  getConversationMessages: jest.fn(),
  getMessagesBetweenUsers: jest.fn(),
  getUnreadMessages: jest.fn()
}));

// Mock pour le service de conversations
jest.mock('../src/services/conversations.service.js', () => ({
  findConversationById: jest.fn()
}));

const MessagesService = require('../src/services/messages.service.js');
const ConversationService = require('../src/services/conversations.service.js');

// Importer le contrôleur de messages
const messagesRoutes = require('../src/route/messages.route.js');

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
      const req = mockRequest();
      req.params.conversationID = 'test-conversation-id';
      const res = mockResponse();

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
