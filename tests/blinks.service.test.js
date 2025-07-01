/**
 * Tests unitaires pour le service de blinks
 * Ces tests vérifient que les opérations sur les blinks fonctionnent correctement
 */

const BlinkService = require('../src/services/blinks.service');
const BlinkRepository = require('../src/repository/blinks.repository');
const BlinkLifetimesRepository = require('../src/repository/blinkLifetimes.repository');
const UsersService = require('../src/services/users.service');
const { sequelize } = require('../src/core/postgres');
const ErrorCodes = require('../constants/errorCodes');
const TIER_LEVELS = require('../constants/tierLevels');

// Mocks pour les dépendances
jest.mock('../src/repository/blinks.repository');
jest.mock('../src/repository/blinkLifetimes.repository');
jest.mock('../src/services/users.service');
jest.mock('../src/core/postgres', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}));

describe('BlinkService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer l'environnement pour les tests
    process.env.API_URL = 'http://test-api.com';
    
    // Mock pour la transaction Sequelize
    const mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    };
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('createBlinkWithContent', () => {
    it('devrait créer un blink avec son contenu', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const contents = [
        { contentType: 'text', content: 'Test content', position: 1 }
      ];
      
      const mockBlink = {
        blinkID: 'test-blink-id',
        userID,
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze'
      };
      
      BlinkRepository.createBlink.mockResolvedValue(mockBlink);
      BlinkRepository.addBlinkContents.mockResolvedValue();
      UsersService.updateUserScore.mockResolvedValue();

      // Appeler la méthode à tester
      const result = await BlinkService.createBlinkWithContent({ userID, contents });

      // Vérifier les résultats
      expect(sequelize.transaction).toHaveBeenCalled();
      expect(BlinkRepository.createBlink).toHaveBeenCalledWith(userID, expect.any(Object));
      expect(BlinkRepository.addBlinkContents).toHaveBeenCalledWith('test-blink-id', contents, expect.any(Object));
      expect(UsersService.updateUserScore).toHaveBeenCalledWith(userID);
      
      expect(result).toEqual(mockBlink);
    });

    it('devrait gérer les erreurs et faire un rollback de la transaction', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const contents = [
        { contentType: 'text', content: 'Test content', position: 1 }
      ];
      
      BlinkRepository.createBlink.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(BlinkService.createBlinkWithContent({ userID, contents }))
        .rejects.toEqual({ message: 'Database error' });
      
      // Vérifier que la transaction a été annulée
      expect(sequelize.transaction).toHaveBeenCalled();
      const mockTransaction = await sequelize.transaction();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('getBlinkById', () => {
    it('devrait récupérer un blink par son ID', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze',
        contents: [
          { contentType: 'text', content: 'Test content', position: 1 }
        ]
      };
      
      BlinkRepository.getBlinkById.mockResolvedValue(mockBlink);

      // Appeler la méthode à tester
      const result = await BlinkService.getBlinkById(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkById).toHaveBeenCalledWith(blinkID);
      expect(result).toEqual(mockBlink);
    });

    it('devrait propager l\'erreur si le blink n\'existe pas', async () => {
      // Configurer les mocks
      const blinkID = 'nonexistent-blink-id';
      
      BlinkRepository.getBlinkById.mockRejectedValue({ message: ErrorCodes.Blinks.NotFound });

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(BlinkService.getBlinkById(blinkID))
        .rejects.toEqual({ message: ErrorCodes.Blinks.NotFound });
    });
  });

  describe('getPaginatedBlinks', () => {
    it('devrait récupérer les blinks paginés avec les URLs d\'avatars transformées', async () => {
      // Configurer les mocks
      const page = 1;
      const limit = 10;
      const userId = null;
      const currentUserId = null;
      
      const mockBlinks = [
        {
          blinkID: 'blink-1',
          userID: 'user-1',
          createdAt: new Date(),
          profile: {
            userID: 'user-1',
            username: 'user1',
            display_name: 'User 1',
            avatar_url: 'avatar1.jpg'
          },
          contents: [
            { contentType: 'text', content: 'Content 1', position: 1 }
          ],
          toJSON: jest.fn().mockReturnValue({
            blinkID: 'blink-1',
            userID: 'user-1',
            createdAt: new Date(),
            profile: {
              userID: 'user-1',
              username: 'user1',
              display_name: 'User 1',
              avatar_url: 'avatar1.jpg'
            },
            contents: [
              { contentType: 'text', content: 'Content 1', position: 1 }
            ]
          })
        },
        {
          blinkID: 'blink-2',
          userID: 'user-2',
          createdAt: new Date(),
          profile: {
            userID: 'user-2',
            username: 'user2',
            display_name: 'User 2',
            avatar_url: null
          },
          contents: [
            { contentType: 'text', content: 'Content 2', position: 1 }
          ],
          toJSON: jest.fn().mockReturnValue({
            blinkID: 'blink-2',
            userID: 'user-2',
            createdAt: new Date(),
            profile: {
              userID: 'user-2',
              username: 'user2',
              display_name: 'User 2',
              avatar_url: null
            },
            contents: [
              { contentType: 'text', content: 'Content 2', position: 1 }
            ]
          })
        }
      ];
      
      BlinkRepository.getPaginatedBlinks.mockResolvedValue({
        total: 2,
        blinks: mockBlinks
      });
      
      // Espionner la méthode _constructProfileUrl
      const constructProfileUrlSpy = jest.spyOn(BlinkService, '_constructProfileUrl');
      constructProfileUrlSpy.mockReturnValue('http://test-api.com/uploads/avatar1.jpg');

      // Appeler la méthode à tester
      const result = await BlinkService.getPaginatedBlinks(page, limit, userId, currentUserId);

      // Vérifier les résultats
      expect(BlinkRepository.getPaginatedBlinks).toHaveBeenCalledWith(page, limit, userId, currentUserId);
      expect(constructProfileUrlSpy).toHaveBeenCalledWith('avatar1.jpg');
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        data: [
          {
            blinkID: 'blink-1',
            userID: 'user-1',
            createdAt: expect.any(Date),
            profile: {
              userID: 'user-1',
              username: 'user1',
              display_name: 'User 1',
              avatar_url: 'http://test-api.com/uploads/avatar1.jpg'
            },
            contents: [
              { contentType: 'text', content: 'Content 1', position: 1 }
            ]
          },
          {
            blinkID: 'blink-2',
            userID: 'user-2',
            createdAt: expect.any(Date),
            profile: {
              userID: 'user-2',
              username: 'user2',
              display_name: 'User 2',
              avatar_url: null
            },
            contents: [
              { contentType: 'text', content: 'Content 2', position: 1 }
            ]
          }
        ]
      });

      // Restaurer l'espion
      constructProfileUrlSpy.mockRestore();
    });

    it('devrait gérer les erreurs lors de la récupération des blinks', async () => {
      // Configurer les mocks
      BlinkRepository.getPaginatedBlinks.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(BlinkService.getPaginatedBlinks(1, 10))
        .rejects.toEqual({ message: ErrorCodes.Blinks.FetchFailed });
    });
  });

  describe('deleteBlink', () => {
    it('devrait supprimer un blink et enregistrer sa durée de vie', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(Date.now() - 86400000), // 1 jour avant
        likeCount: 0,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze'
      };
      
      BlinkRepository.getBlinkById.mockResolvedValue(mockBlink);
      BlinkLifetimesRepository.recordBlinkLifetime.mockResolvedValue();
      BlinkRepository.deleteBlink.mockResolvedValue(1);
      UsersService.updateUserScore.mockResolvedValue();
      
      // Espionner Date.now pour avoir une valeur constante
      const originalDate = global.Date;
      const mockDate = new Date(Date.now());
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      };

      // Appeler la méthode à tester
      const result = await BlinkService.deleteBlink(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkById).toHaveBeenCalledWith(blinkID);
      expect(BlinkLifetimesRepository.recordBlinkLifetime).toHaveBeenCalledWith({
        userID: 'test-user-id',
        blinkID,
        createdAt: expect.any(Date),
        deletedAt: expect.any(Date),
        lifetime: expect.any(Number)
      }, null);
      expect(UsersService.updateUserScore).toHaveBeenCalledWith('test-user-id');
      expect(BlinkRepository.deleteBlink).toHaveBeenCalledWith(blinkID, null);
      expect(result).toBe(1);

      // Restaurer Date
      global.Date = originalDate;
    });

    it('devrait retourner null si le blink n\'existe pas', async () => {
      // Configurer les mocks
      const blinkID = 'nonexistent-blink-id';
      
      BlinkRepository.getBlinkById.mockResolvedValue(null);

      // Appeler la méthode à tester
      const result = await BlinkService.deleteBlink(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkById).toHaveBeenCalledWith(blinkID);
      expect(BlinkLifetimesRepository.recordBlinkLifetime).not.toHaveBeenCalled();
      expect(UsersService.updateUserScore).not.toHaveBeenCalled();
      expect(BlinkRepository.deleteBlink).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('devrait propager l\'erreur en cas d\'échec', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(),
        likeCount: 0,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze'
      };
      
      BlinkRepository.getBlinkById.mockResolvedValue(mockBlink);
      BlinkLifetimesRepository.recordBlinkLifetime.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(BlinkService.deleteBlink(blinkID))
        .rejects.toThrow('Database error');
    });
  });

  describe('calculateRemainingTime', () => {
    it('devrait retourner Infinity pour un blink de palier gold', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(),
        likeCount: 100,
        commentCount: 50,
        dislikeCount: 10,
        tier: 'gold'
      };
      
      BlinkRepository.getBlinkHeaderById.mockResolvedValue(mockBlink);

      // Appeler la méthode à tester
      const result = await BlinkService.calculateRemainingTime(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkHeaderById).toHaveBeenCalledWith(blinkID);
      expect(result).toBe(Infinity);
    });

    it('devrait calculer le temps restant pour un blink de palier bronze', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(Date.now() - 86400000), // 1 jour avant
        likeCount: 10,
        commentCount: 5,
        dislikeCount: 2,
        tier: 'bronze'
      };
      
      BlinkRepository.getBlinkHeaderById.mockResolvedValue(mockBlink);
      
      // Espionner Date.now pour avoir une valeur constante
      const originalDate = global.Date;
      const mockDate = new Date(Date.now());
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      };

      // Appeler la méthode à tester
      const result = await BlinkService.calculateRemainingTime(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkHeaderById).toHaveBeenCalledWith(blinkID);
      
      // Calculer le temps restant attendu
      const baseLifetime = 86400 + 30 * 86400; // 24h + 1 mois en secondes
      const likeBonus = 10 * 86.4;
      const commentBonus = 5 * 172.8;
      const dislikePenalty = 2 * 43.2;
      const elapsedTime = 86400; // 1 jour en secondes
      const expectedRemainingTime = baseLifetime + likeBonus + commentBonus - dislikePenalty - elapsedTime;
      
      expect(result).toBeCloseTo(expectedRemainingTime, 0);

      // Restaurer Date
      global.Date = originalDate;
    });

    it('devrait retourner 0 si le temps est écoulé', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(Date.now() - 90 * 86400000), // 90 jours avant
        likeCount: 0,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze'
      };
      
      BlinkRepository.getBlinkHeaderById.mockResolvedValue(mockBlink);
      
      // Espionner Date.now pour avoir une valeur constante
      const originalDate = global.Date;
      const mockDate = new Date(Date.now());
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
      };

      // Appeler la méthode à tester
      const result = await BlinkService.calculateRemainingTime(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkHeaderById).toHaveBeenCalledWith(blinkID);
      expect(result).toBe(0);

      // Restaurer Date
      global.Date = originalDate;
    });

    it('devrait lever une erreur si le blink n\'existe pas', async () => {
      // Configurer les mocks
      const blinkID = 'nonexistent-blink-id';
      
      BlinkRepository.getBlinkHeaderById.mockRejectedValue({ message: ErrorCodes.Blinks.NotFound });

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(BlinkService.calculateRemainingTime(blinkID))
        .rejects.toEqual({ message: ErrorCodes.Blinks.NotFound });
    });
  });

  describe('updateBlinkTier', () => {
    it('devrait mettre à jour le palier d\'un blink en fonction du nombre de likes', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(),
        likeCount: 50,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze',
        save: jest.fn().mockResolvedValue()
      };
      
      BlinkRepository.getBlinkById.mockResolvedValue(mockBlink);

      // Appeler la méthode à tester
      await BlinkService.updateBlinkTier(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkById).toHaveBeenCalledWith(blinkID);
      expect(mockBlink.tier).toBe('silver');
      expect(mockBlink.save).toHaveBeenCalled();
    });

    it('ne devrait pas mettre à jour le palier si le nombre de likes est insuffisant', async () => {
      // Configurer les mocks
      const blinkID = 'test-blink-id';
      const mockBlink = {
        blinkID,
        userID: 'test-user-id',
        createdAt: new Date(),
        likeCount: 10,
        commentCount: 0,
        dislikeCount: 0,
        tier: 'bronze',
        save: jest.fn().mockResolvedValue()
      };
      
      BlinkRepository.getBlinkById.mockResolvedValue(mockBlink);

      // Appeler la méthode à tester
      await BlinkService.updateBlinkTier(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkById).toHaveBeenCalledWith(blinkID);
      expect(mockBlink.tier).toBe('bronze');
      expect(mockBlink.save).not.toHaveBeenCalled();
    });

    it('ne devrait rien faire si le blink n\'existe pas', async () => {
      // Configurer les mocks
      const blinkID = 'nonexistent-blink-id';
      
      BlinkRepository.getBlinkById.mockResolvedValue(null);

      // Appeler la méthode à tester
      await BlinkService.updateBlinkTier(blinkID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinkById).toHaveBeenCalledWith(blinkID);
    });
  });

  describe('searchBlinksAndUsers', () => {
    it('devrait rechercher des blinks et des utilisateurs par mot-clé', async () => {
      // Configurer les mocks
      const query = 'test';
      const page = 1;
      const limit = 10;
      
      const mockUsers = [
        {
          userID: 'user-1',
          username: 'testuser',
          display_name: 'Test User',
          avatar_url: 'avatar1.jpg',
          toJSON: jest.fn().mockReturnValue({
            userID: 'user-1',
            username: 'testuser',
            display_name: 'Test User',
            avatar_url: 'avatar1.jpg'
          })
        }
      ];
      
      const mockBlinks = [
        {
          blinkID: 'blink-1',
          Blink: {
            blinkID: 'blink-1',
            createdAt: new Date(),
            profile: {
              display_name: 'Test User',
              username: 'testuser',
              avatar_url: 'avatar1.jpg'
            }
          },
          contentType: 'text',
          content: 'Test content',
          position: 1
        }
      ];
      
      BlinkRepository.searchBlinksAndUsers.mockResolvedValue({
        users: mockUsers,
        blinks: mockBlinks
      });
      
      // Espionner la méthode _constructProfileUrl
      const constructProfileUrlSpy = jest.spyOn(BlinkService, '_constructProfileUrl');
      constructProfileUrlSpy.mockReturnValue('http://test-api.com/uploads/avatar1.jpg');

      // Appeler la méthode à tester
      const result = await BlinkService.searchBlinksAndUsers(query, page, limit);

      // Vérifier les résultats
      expect(BlinkRepository.searchBlinksAndUsers).toHaveBeenCalledWith(query, page, limit);
      expect(constructProfileUrlSpy).toHaveBeenCalledWith('avatar1.jpg');
      
      expect(result).toEqual({
        users: [
          {
            userID: 'user-1',
            username: 'testuser',
            display_name: 'Test User',
            avatar_url: 'http://test-api.com/uploads/avatar1.jpg'
          }
        ],
        blinks: mockBlinks
      });

      // Restaurer l'espion
      constructProfileUrlSpy.mockRestore();
    });

    it('devrait lever une erreur si la requête est vide', async () => {
      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(BlinkService.searchBlinksAndUsers(''))
        .rejects.toEqual({ message: ErrorCodes.Blinks.InvalidSearchQuery });
      
      // Vérifier que la méthode du repository n'a pas été appelée
      expect(BlinkRepository.searchBlinksAndUsers).not.toHaveBeenCalled();
    });
  });

  describe('getUserScore', () => {
    it('devrait calculer le score d\'un utilisateur en fonction de ses blinks', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const mockBlinks = [
        {
          blinkID: 'blink-1',
          createdAt: new Date(),
          likeCount: 10,
          commentCount: 5,
          dislikeCount: 2,
          tier: 'bronze'
        },
        {
          blinkID: 'blink-2',
          createdAt: new Date(),
          likeCount: 20,
          commentCount: 10,
          dislikeCount: 5,
          tier: 'silver'
        }
      ];
      
      BlinkRepository.getBlinksByUser.mockResolvedValue(mockBlinks);
      
      // Espionner la méthode calculateRemainingTime
      const calculateRemainingTimeSpy = jest.spyOn(BlinkService, 'calculateRemainingTime');
      calculateRemainingTimeSpy.mockResolvedValueOnce(100000);
      calculateRemainingTimeSpy.mockResolvedValueOnce(200000);

      // Appeler la méthode à tester
      const result = await BlinkService.getUserScore(userID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinksByUser).toHaveBeenCalledWith(userID);
      expect(calculateRemainingTimeSpy).toHaveBeenCalledWith('blink-1');
      expect(calculateRemainingTimeSpy).toHaveBeenCalledWith('blink-2');
      
      expect(result).toBe(150000);

      // Restaurer l'espion
      calculateRemainingTimeSpy.mockRestore();
    });

    it('devrait retourner 0 si l\'utilisateur n\'a pas de blinks', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      
      BlinkRepository.getBlinksByUser.mockResolvedValue([]);

      // Appeler la méthode à tester
      const result = await BlinkService.getUserScore(userID);

      // Vérifier les résultats
      expect(BlinkRepository.getBlinksByUser).toHaveBeenCalledWith(userID);
      expect(result).toBe(0);
    });
  });
});
