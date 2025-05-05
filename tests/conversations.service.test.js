/**
 * Tests unitaires pour le service de conversations
 * Ces tests vérifient que les conversations sont correctement créées et récupérées
 */

// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const ConversationService = require('../src/services/conversations.service');
const ConversationsRepository = require('../src/repository/conversations.repository');
const MessagesRepository = require('../src/repository/messages.repository');
const { sequelize } = require('../src/core/postgres');

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

    it('devrait gérer le cas où il n\'y a pas de dernier message', async () => {
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
        avatar_url: null
      });
      
      MessagesRepository.getLastMessage.mockResolvedValue(null);
      MessagesRepository.countUnreadMessages.mockResolvedValue(0);

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ConversationService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue(null);

      // Appeler la méthode à tester
      const result = await ConversationService.getUserConversations(userID);

      // Vérifier les résultats
      expect(result).toEqual([
        {
          conversationID,
          userID: otherUserID,
          username: 'testuser',
          display_name: 'Test User',
          avatar_url: null,
          lastMessage: null,
          unreadCount: 0
        }
      ]);

      // Restaurer l'espion
      buildAvatarUrlSpy.mockRestore();
    });
  });

  describe('buildAvatarUrl', () => {
    it('devrait construire l\'URL complète de l\'avatar', () => {
      // Sauvegarder l'environnement original
      const originalEnv = process.env;
      
      // Configurer l'environnement pour le test
      process.env = {
        ...originalEnv,
        API_URL: 'http://test-api.com'
      };

      // Appeler la méthode à tester
      const result = ConversationService.buildAvatarUrl('avatar.jpg');

      // Vérifier le résultat
      expect(result).toBe('http://test-api.com/uploads/avatar.jpg');

      // Restaurer l'environnement original
      process.env = originalEnv;
    });

    it('devrait retourner null si le nom de fichier est null', () => {
      // Appeler la méthode à tester
      const result = ConversationService.buildAvatarUrl(null);

      // Vérifier le résultat
      expect(result).toBeNull();
    });
  });
});
