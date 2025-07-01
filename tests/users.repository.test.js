/**
 * Tests unitaires pour le repository d'utilisateurs
 * Ces tests vérifient que les opérations CRUD sur les utilisateurs fonctionnent correctement
 */

// Importer les associations avant d'utiliser les modèles
require('../src/models/associations');

const UsersRepository = require('../src/repository/users.repository');
const User = require('../src/models/users');
const ErrorCodes = require('../constants/errorCodes');
const { sequelize } = require('../src/core/postgres');

// Mock pour le modèle User
jest.mock('../src/models/users');

describe('UsersRepository', () => {
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

  describe('createUser', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: false
      };
      
      User.create.mockResolvedValue(mockUser);

      // Appeler la méthode à tester
      const result = await UsersRepository.createUser({
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: false
      });

      // Vérifier les résultats
      expect(User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: false
      });
      
      expect(result).toEqual(mockUser);
    });

    it('devrait lever une erreur si la création échoue', async () => {
      // Configurer les mocks
      User.create.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(UsersRepository.createUser({
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: false
      })).rejects.toEqual({ message: ErrorCodes.User.CreationFailed });
      
      // Vérifier que la méthode create a été appelée
      expect(User.create).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('devrait récupérer un utilisateur par son ID', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        isVerified: true
      };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Appeler la méthode à tester
      const result = await UsersRepository.getUserById('test-user-id');

      // Vérifier les résultats
      expect(User.findByPk).toHaveBeenCalledWith('test-user-id', {
        attributes: { exclude: ['password'] }
      });
      
      expect(result).toEqual(mockUser);
    });

    it('devrait lever une erreur si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      User.findByPk.mockResolvedValue(null);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(UsersRepository.getUserById('nonexistent-user-id'))
        .rejects.toEqual({ message: ErrorCodes.User.NotFound });
      
      // Vérifier que la méthode findByPk a été appelée
      expect(User.findByPk).toHaveBeenCalledWith('nonexistent-user-id', {
        attributes: { exclude: ['password'] }
      });
    });
  });

  describe('getUserByEmail', () => {
    it('devrait récupérer un utilisateur par son email', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user',
        isVerified: true
      };
      
      User.findOne.mockResolvedValue(mockUser);

      // Appeler la méthode à tester
      const result = await UsersRepository.getUserByEmail('test@example.com');

      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      User.findOne.mockResolvedValue(null);

      // Appeler la méthode à tester
      const result = await UsersRepository.getUserByEmail('nonexistent@example.com');

      // Vérifier les résultats
      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('devrait mettre à jour un utilisateur', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'old-password',
        update: jest.fn().mockResolvedValue({
          userID: 'test-user-id',
          email: 'test@example.com',
          password: 'new-password'
        })
      };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Appeler la méthode à tester
      const result = await UsersRepository.updateUser('test-user-id', {
        password: 'new-password'
      });

      // Vérifier les résultats
      expect(User.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'new-password'
      });
      
      expect(result).toEqual({
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'new-password'
      });
    });

    it('devrait lever une erreur si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      User.findByPk.mockResolvedValue(null);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(UsersRepository.updateUser('nonexistent-user-id', {
        password: 'new-password'
      })).rejects.toEqual({ message: ErrorCodes.User.NotFound });
      
      // Vérifier que la méthode findByPk a été appelée
      expect(User.findByPk).toHaveBeenCalledWith('nonexistent-user-id');
    });

    it('devrait lever une erreur si la mise à jour échoue', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'old-password',
        update: jest.fn().mockRejectedValue(new Error('Database error'))
      };
      
      User.findByPk.mockResolvedValue(mockUser);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(UsersRepository.updateUser('test-user-id', {
        password: 'new-password'
      })).rejects.toEqual({ message: ErrorCodes.User.UpdateFailed });
      
      // Vérifier que les méthodes ont été appelées
      expect(User.findByPk).toHaveBeenCalledWith('test-user-id');
      expect(mockUser.update).toHaveBeenCalledWith({
        password: 'new-password'
      });
    });
  });

  describe('deleteUser', () => {
    it('devrait supprimer un utilisateur', async () => {
      // Configurer les mocks
      User.destroy.mockResolvedValue(1); // 1 ligne affectée

      // Appeler la méthode à tester
      await UsersRepository.deleteUser('test-user-id');

      // Vérifier les résultats
      expect(User.destroy).toHaveBeenCalledWith({ where: { userID: 'test-user-id' } });
    });

    it('devrait lever une erreur si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      User.destroy.mockResolvedValue(0); // 0 ligne affectée

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(UsersRepository.deleteUser('nonexistent-user-id'))
        .rejects.toEqual({ message: ErrorCodes.User.NotFound });
      
      // Vérifier que la méthode destroy a été appelée
      expect(User.destroy).toHaveBeenCalledWith({ where: { userID: 'nonexistent-user-id' } });
    });

    it('devrait lever une erreur si la suppression échoue', async () => {
      // Configurer les mocks
      User.destroy.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(UsersRepository.deleteUser('test-user-id'))
        .rejects.toEqual({ message: ErrorCodes.User.DeletionFailed });
      
      // Vérifier que la méthode destroy a été appelée
      expect(User.destroy).toHaveBeenCalledWith({ where: { userID: 'test-user-id' } });
    });
  });
});
