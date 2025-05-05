/**
 * Tests unitaires pour le repository de conversations
 * Ces tests vérifient que les opérations CRUD sur les conversations fonctionnent correctement
 */

// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const ConversationsRepository = require('../src/repository/conversations.repository');
const Conversations = require('../src/models/conversations');
const Profiles = require('../src/models/profiles');
const { sequelize } = require('../src/core/postgres');
const { Op } = require('sequelize');

// Mock pour les modèles Sequelize
jest.mock('../src/models/conversations');
jest.mock('../src/models/profiles');

describe('ConversationsRepository', () => {
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

  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('devrait créer une nouvelle conversation', async () => {
      // Configurer les mocks
      const participants = ['user1', 'user2'];
      const mockConversation = {
        conversationID: 'test-conversation-id',
        participants,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Conversations.create.mockResolvedValue(mockConversation);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.createConversation(participants);

      // Vérifier les résultats
      expect(Conversations.create).toHaveBeenCalledWith({ participants });
      expect(result).toEqual(mockConversation);
    });

    it('devrait lever une erreur si la création échoue', async () => {
      // Configurer les mocks
      const participants = ['user1', 'user2'];
      
      Conversations.create.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ConversationsRepository.createConversation(participants))
        .rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('devrait trouver une conversation par son ID', async () => {
      // Configurer les mocks
      const conversationID = 'test-conversation-id';
      const mockConversation = {
        conversationID,
        participants: ['user1', 'user2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Conversations.findByPk.mockResolvedValue(mockConversation);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.findById(conversationID);

      // Vérifier les résultats
      expect(Conversations.findByPk).toHaveBeenCalledWith(conversationID);
      expect(result).toEqual(mockConversation);
    });

    it('devrait retourner null si la conversation n\'existe pas', async () => {
      // Configurer les mocks
      const conversationID = 'nonexistent-conversation-id';
      
      Conversations.findByPk.mockResolvedValue(null);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.findById(conversationID);

      // Vérifier les résultats
      expect(Conversations.findByPk).toHaveBeenCalledWith(conversationID);
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('devrait récupérer toutes les conversations', async () => {
      // Configurer les mocks
      const mockConversations = [
        {
          conversationID: 'conversation-1',
          participants: ['user1', 'user2'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          conversationID: 'conversation-2',
          participants: ['user1', 'user3'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      Conversations.findAll.mockResolvedValue(mockConversations);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.findAll();

      // Vérifier les résultats
      expect(Conversations.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockConversations);
    });
  });

  describe('findByParticipant', () => {
    it('devrait récupérer les conversations d\'un utilisateur', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const mockConversations = [
        {
          conversationID: 'conversation-1',
          participants: [userID, 'user2'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          conversationID: 'conversation-2',
          participants: [userID, 'user3'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      Conversations.findAll.mockResolvedValue(mockConversations);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.findByParticipant(userID);

      // Vérifier les résultats
      expect(Conversations.findAll).toHaveBeenCalledWith({
        where: {
          participants: {
            [Op.contains]: [userID]
          }
        },
        order: [['updatedAt', 'DESC']]
      });
      expect(result).toEqual(mockConversations);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une conversation', async () => {
      // Configurer les mocks
      const conversationID = 'test-conversation-id';
      const updates = { participants: ['user1', 'user2', 'user3'] };
      const options = { transaction: 'mock-transaction' };
      
      const mockConversation = {
        conversationID,
        participants: ['user1', 'user2'],
        update: jest.fn().mockResolvedValue({
          conversationID,
          participants: ['user1', 'user2', 'user3']
        })
      };
      
      Conversations.findByPk.mockResolvedValue(mockConversation);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.update(conversationID, updates, options);

      // Vérifier les résultats
      expect(Conversations.findByPk).toHaveBeenCalledWith(conversationID);
      expect(mockConversation.update).toHaveBeenCalledWith(updates, options);
      expect(result).toEqual({
        conversationID,
        participants: ['user1', 'user2', 'user3']
      });
    });

    it('devrait lever une erreur si la conversation n\'existe pas', async () => {
      // Configurer les mocks
      const conversationID = 'nonexistent-conversation-id';
      const updates = { participants: ['user1', 'user2', 'user3'] };
      
      Conversations.findByPk.mockResolvedValue(null);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ConversationsRepository.update(conversationID, updates))
        .rejects.toThrow('Conversation non trouvée');
    });
  });

  describe('getParticipantProfile', () => {
    it('devrait récupérer le profil d\'un participant', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const mockProfile = {
        userID,
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: 'avatar.jpg'
      };
      
      Profiles.findOne.mockResolvedValue(mockProfile);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.getParticipantProfile(userID);

      // Vérifier les résultats
      expect(Profiles.findOne).toHaveBeenCalledWith({
        where: { userID },
        attributes: ['userID', 'username', 'display_name', 'avatar_url']
      });
      expect(result).toEqual(mockProfile);
    });

    it('devrait retourner null si le profil n\'existe pas', async () => {
      // Configurer les mocks
      const userID = 'nonexistent-user-id';
      
      Profiles.findOne.mockResolvedValue(null);

      // Appeler la méthode à tester
      const result = await ConversationsRepository.getParticipantProfile(userID);

      // Vérifier les résultats
      expect(Profiles.findOne).toHaveBeenCalledWith({
        where: { userID },
        attributes: ['userID', 'username', 'display_name', 'avatar_url']
      });
      expect(result).toBeNull();
    });
  });
});
