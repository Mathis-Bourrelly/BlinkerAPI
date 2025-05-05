/**
 * Tests unitaires pour le repository de messages
 * Ces tests vérifient que les messages sont correctement récupérés avec les informations de l'expéditeur
 */

// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const MessagesRepository = require('../src/repository/messages.repository');
const { sequelize } = require('../src/core/postgres');

// Mock d'une conversation pour les tests
const TEST_CONVERSATION_ID = 'bff0ad4f-4f5f-4818-84ac-2d9692f414b0';

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
      // Récupérer les messages de la conversation de test
      const messages = await MessagesRepository.getConversationMessages(TEST_CONVERSATION_ID);
      
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

  describe('getUnreadMessages', () => {
    it('devrait récupérer les messages non lus avec les informations de l\'expéditeur', async () => {
      // Récupérer les conversations pour obtenir leurs IDs
      const conversations = await sequelize.query(
        "SELECT \"conversationID\" FROM \"Conversations\" LIMIT 5",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (conversations.length === 0) {
        console.log('Aucune conversation trouvée pour le test');
        return;
      }
      
      const conversationIDs = conversations.map(c => c.conversationID);
      
      // Récupérer les messages non lus
      const messages = await MessagesRepository.getUnreadMessages(conversationIDs);
      
      // Si des messages non lus sont trouvés, vérifier qu'ils ont les informations de l'expéditeur
      if (messages.length > 0) {
        messages.forEach(message => {
          expect(message.senderID).toBeDefined();
          expect(message.sender).toBeDefined();
          expect(message.sender.userID).toBeDefined();
          expect(message.sender.email).toBeDefined();
          expect(message.sender.userID).toBe(message.senderID);
        });
      }
    });
  });

  describe('getLastMessage', () => {
    it('devrait récupérer le dernier message avec les informations de l\'expéditeur', async () => {
      // Récupérer le dernier message de la conversation de test
      const message = await MessagesRepository.getLastMessage(TEST_CONVERSATION_ID);
      
      // Vérifier que le message a été récupéré
      expect(message).toBeDefined();
      
      // Vérifier que le message a un contenu
      expect(message.content).toBeDefined();
      
      // Vérifier que le message a un sender
      expect(message.sender).toBeDefined();
      expect(message.sender.userID).toBeDefined();
      expect(message.sender.email).toBeDefined();
    });
  });
});
