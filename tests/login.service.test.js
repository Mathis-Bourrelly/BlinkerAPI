/**
 * Tests unitaires pour le service d'authentification
 * Ces tests vérifient que l'authentification et la génération de tokens JWT fonctionnent correctement
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const LoginService = require('../src/services/login.service');
const UsersService = require('../src/services/users.service');
const UsersRepository = require('../src/repository/users.repository');
const ProfilesService = require('../src/services/profiles.service');
const ErrorCodes = require('../constants/errorCodes');

// Mocks pour les dépendances
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../src/services/users.service');
jest.mock('../src/repository/users.repository');
jest.mock('../src/services/profiles.service');

describe('LoginService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer l'environnement pour les tests
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('login', () => {
    it('devrait authentifier un utilisateur et générer un token JWT', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user',
        isVerified: true
      };
      
      const mockProfile = {
        userID: 'test-user-id',
        avatar_url: 'avatar.jpg'
      };
      
      UsersService.getUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      ProfilesService.getProfileByUserID.mockResolvedValue(mockProfile);
      jwt.sign.mockReturnValue('test-token');

      // Appeler la méthode à tester
      const result = await LoginService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      // Vérifier les résultats
      expect(UsersService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(ProfilesService.getProfileByUserID).toHaveBeenCalledWith('test-user-id');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userID: 'test-user-id',
          email: 'test@example.com',
          role: 'user',
          avatar_url: 'avatar.jpg'
        },
        'test-secret',
        { expiresIn: '1d' }
      );
      
      expect(result).toEqual({
        token: 'test-token',
        userID: 'test-user-id'
      });
    });

    it('devrait lever une erreur si l\'email ou le mot de passe est manquant', async () => {
      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(LoginService.login({ email: '', password: 'password123' }))
        .rejects.toEqual({ message: ErrorCodes.Login.FieldEmailRequired });
      
      await expect(LoginService.login({ email: 'test@example.com', password: '' }))
        .rejects.toEqual({ message: ErrorCodes.Login.FieldEmailRequired });
      
      // Vérifier que les méthodes des dépendances n'ont pas été appelées
      expect(UsersService.getUserByEmail).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('devrait lever une erreur si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      UsersService.getUserByEmail.mockResolvedValue(null);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(LoginService.login({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toEqual({ message: ErrorCodes.Login.IncorrectPassword });
      
      // Vérifier que les méthodes des dépendances ont été appelées correctement
      expect(UsersService.getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('devrait lever une erreur si le mot de passe est incorrect', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: true
      };
      
      UsersService.getUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(LoginService.login({
        email: 'test@example.com',
        password: 'wrong-password'
      })).rejects.toEqual({ message: ErrorCodes.Login.IncorrectPassword });
      
      // Vérifier que les méthodes des dépendances ont été appelées correctement
      expect(UsersService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });

    it('devrait lever une erreur si le compte n\'est pas vérifié', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isVerified: false
      };
      
      UsersService.getUserByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(LoginService.login({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toEqual({ message: ErrorCodes.Login.AccountLocked });
      
      // Vérifier que les méthodes des dépendances ont été appelées correctement
      expect(UsersService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });
  });
});
