/**
 * Tests unitaires pour le service de profils
 * Ces tests vérifient que les opérations sur les profils fonctionnent correctement
 */

const ProfilesService = require('../src/services/profiles.service');
const ProfilesRepository = require('../src/repository/profiles.repository');
const UsersRepository = require('../src/repository/users.repository');
const ErrorCodes = require('../constants/errorCodes');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Mocks pour les dépendances
jest.mock('../src/repository/profiles.repository');
jest.mock('../src/repository/users.repository');
jest.mock('fs');
jest.mock('https');
jest.mock('path');

describe('ProfilesService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();

    // Configurer l'environnement pour les tests
    process.env.API_URL = 'http://test-api.com';
  });

  describe('buildAvatarUrl', () => {
    it('devrait construire l\'URL complète de l\'avatar', () => {
      // Appeler la méthode à tester
      const result = ProfilesService.buildAvatarUrl('avatar.jpg');

      // Vérifier le résultat
      expect(result).toBe('http://test-api.com/uploads/avatar.jpg');
    });

    it('devrait retourner null si le nom de fichier est null', () => {
      // Appeler la méthode à tester
      const result = ProfilesService.buildAvatarUrl(null);

      // Vérifier le résultat
      expect(result).toBeNull();
    });

    it('devrait utiliser l\'URL par défaut si API_URL n\'est pas défini', () => {
      // Sauvegarder l'environnement original
      const originalEnv = process.env;

      // Configurer l'environnement pour le test
      delete process.env.API_URL;
      process.env.NODE_ENV = 'production';

      // Appeler la méthode à tester
      const result = ProfilesService.buildAvatarUrl('avatar.jpg');

      // Vérifier le résultat
      expect(result).toBe('https://dev.blinker.eterny.fr/uploads/avatar.jpg');

      // Restaurer l'environnement original
      process.env = originalEnv;
    });
  });

  describe('downloadAndStoreGoogleProfilePicture', () => {
    it('devrait télécharger et stocker la photo de profil Google', async () => {
      // Configurer les mocks
      const mockPipe = jest.fn();
      const mockResponse = {
        pipe: mockPipe
      };

      const mockFile = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'finish') {
            callback();
          }
          return mockFile;
        }),
        close: jest.fn()
      };

      fs.createWriteStream.mockReturnValue(mockFile);
      https.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return {
          on: jest.fn().mockReturnThis()
        };
      });

      path.join.mockReturnValue('/path/to/uploads/google_123456789.jpg');

      // Espionner Date.now pour avoir une valeur constante
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(123456789);

      // Appeler la méthode à tester
      const result = await ProfilesService.downloadAndStoreGoogleProfilePicture('https://example.com/photo.jpg');

      // Vérifier les résultats
      expect(fs.createWriteStream).toHaveBeenCalledWith('/path/to/uploads/google_123456789.jpg');
      expect(https.get).toHaveBeenCalledWith('https://example.com/photo.jpg', expect.any(Function));
      expect(mockPipe).toHaveBeenCalledWith(mockFile);
      expect(mockFile.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockFile.close).toHaveBeenCalled();
      expect(result).toBe('google_123456789.jpg');

      // Restaurer Date.now
      Date.now = originalDateNow;
    });

    it('devrait gérer les erreurs lors du téléchargement', async () => {
      // Configurer les mocks
      const mockError = new Error('Download failed');

      fs.createWriteStream.mockReturnValue({});
      https.get.mockImplementation(() => {
        return {
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'error') {
              callback(mockError);
            }
            return {
              on: jest.fn()
            };
          })
        };
      });

      path.join.mockReturnValue('/path/to/uploads/google_123456789.jpg');
      fs.unlink.mockImplementation((path, callback) => callback());

      // Espionner Date.now pour avoir une valeur constante
      const originalDateNow = Date.now;
      Date.now = jest.fn().mockReturnValue(123456789);

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ProfilesService.downloadAndStoreGoogleProfilePicture('https://example.com/photo.jpg'))
        .rejects.toEqual(mockError);

      // Vérifier que le fichier a été supprimé en cas d'erreur
      expect(fs.unlink).toHaveBeenCalledWith('/path/to/uploads/google_123456789.jpg', expect.any(Function));

      // Restaurer Date.now
      Date.now = originalDateNow;
    });
  });

  describe('createProfile', () => {
    it('devrait créer un profil avec un avatar uploadé', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const username = 'testuser';
      const display_name = 'Test User';
      const bio = 'This is a test bio';
      const file = { filename: 'avatar.jpg' };

      UsersRepository.getUserById.mockResolvedValue({ userID });
      ProfilesRepository.findByUsername.mockResolvedValue(null);
      ProfilesRepository.create.mockResolvedValue({
        userID,
        username,
        display_name,
        bio,
        avatar_url: 'avatar.jpg'
      });

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://test-api.com/uploads/avatar.jpg');

      // Appeler la méthode à tester
      const result = await ProfilesService.createProfile(userID, username, display_name, bio, file);

      // Vérifier les résultats
      expect(UsersRepository.getUserById).toHaveBeenCalledWith(userID);
      expect(ProfilesRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(ProfilesRepository.create).toHaveBeenCalledWith({
        userID,
        username,
        display_name,
        bio,
        avatar_url: 'avatar.jpg'
      });
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('avatar.jpg');

      expect(result).toEqual({
        userID,
        username,
        display_name,
        bio,
        avatar_url: 'http://test-api.com/uploads/avatar.jpg'
      });

      // Restaurer l'espion
      buildAvatarUrlSpy.mockRestore();
    });

    it('devrait créer un profil avec une photo de profil Google', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const username = 'testuser';
      const display_name = 'Test User';
      const bio = 'This is a test bio';
      const file = 'https://example.com/photo.jpg';

      UsersRepository.getUserById.mockResolvedValue({ userID });
      ProfilesRepository.findByUsername.mockResolvedValue(null);
      ProfilesRepository.create.mockResolvedValue({
        userID,
        username,
        display_name,
        bio,
        avatar_url: 'google_123456789.jpg'
      });

      // Espionner les méthodes
      const downloadSpy = jest.spyOn(ProfilesService, 'downloadAndStoreGoogleProfilePicture');
      downloadSpy.mockResolvedValue('google_123456789.jpg');

      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://test-api.com/uploads/google_123456789.jpg');

      // Appeler la méthode à tester
      const result = await ProfilesService.createProfile(userID, username, display_name, bio, file);

      // Vérifier les résultats
      expect(UsersRepository.getUserById).toHaveBeenCalledWith(userID);
      expect(ProfilesRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(downloadSpy).toHaveBeenCalledWith('https://example.com/photo.jpg');
      expect(ProfilesRepository.create).toHaveBeenCalledWith({
        userID,
        username,
        display_name,
        bio,
        avatar_url: 'google_123456789.jpg'
      });
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('google_123456789.jpg');

      expect(result).toEqual({
        userID,
        username,
        display_name,
        bio,
        avatar_url: 'http://test-api.com/uploads/google_123456789.jpg'
      });

      // Restaurer les espions
      downloadSpy.mockRestore();
      buildAvatarUrlSpy.mockRestore();
    });

    it('devrait créer un profil sans avatar', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const username = 'testuser';
      const display_name = 'Test User';
      const bio = 'This is a test bio';
      const file = null;

      UsersRepository.getUserById.mockResolvedValue({ userID });
      ProfilesRepository.findByUsername.mockResolvedValue(null);
      ProfilesRepository.create.mockResolvedValue({
        userID,
        username,
        display_name,
        bio,
        avatar_url: null
      });

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue(null);

      // Appeler la méthode à tester
      const result = await ProfilesService.createProfile(userID, username, display_name, bio, file);

      // Vérifier les résultats
      expect(UsersRepository.getUserById).toHaveBeenCalledWith(userID);
      expect(ProfilesRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(ProfilesRepository.create).toHaveBeenCalledWith({
        userID,
        username,
        display_name,
        bio,
        avatar_url: null
      });
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith(null);

      expect(result).toEqual({
        userID,
        username,
        display_name,
        bio,
        avatar_url: null
      });

      // Restaurer l'espion
      buildAvatarUrlSpy.mockRestore();
    });

    it('devrait lever une erreur si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      const userID = 'nonexistent-user-id';
      const username = 'testuser';
      const display_name = 'Test User';
      const bio = 'This is a test bio';
      const file = null;

      UsersRepository.getUserById.mockRejectedValue({ message: ErrorCodes.User.NotFound });

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ProfilesService.createProfile(userID, username, display_name, bio, file))
        .rejects.toEqual({ message: ErrorCodes.User.NotFound });

      // Vérifier que les méthodes du repository n'ont pas été appelées
      expect(ProfilesRepository.findByUsername).not.toHaveBeenCalled();
      expect(ProfilesRepository.create).not.toHaveBeenCalled();
    });

    it('devrait lever une erreur si le username est déjà pris', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const username = 'existinguser';
      const display_name = 'Test User';
      const bio = 'This is a test bio';
      const file = null;

      UsersRepository.getUserById.mockResolvedValue({ userID });
      ProfilesRepository.findByUsername.mockResolvedValue({ username });

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ProfilesService.createProfile(userID, username, display_name, bio, file))
        .rejects.toEqual({ message: ErrorCodes.Profiles.UsernameTaken });

      // Vérifier que la méthode create n'a pas été appelée
      expect(ProfilesRepository.create).not.toHaveBeenCalled();
    });

    it('devrait lever une erreur si la création échoue', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const username = 'testuser';
      const display_name = 'Test User';
      const bio = 'This is a test bio';
      const file = null;

      UsersRepository.getUserById.mockResolvedValue({ userID });
      ProfilesRepository.findByUsername.mockResolvedValue(null);
      ProfilesRepository.create.mockRejectedValue(new Error('Database error'));

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ProfilesService.createProfile(userID, username, display_name, bio, file))
        .rejects.toEqual({ message: ErrorCodes.Profiles.CreationFailed });
    });
  });

  describe('getProfileByUserID', () => {
    it('devrait récupérer un profil avec un score existant', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const profile = {
        userID,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test bio',
        avatar_url: 'avatar.jpg',
        score: 24,
        dataValues: {}
      };

      ProfilesRepository.findByUserID.mockResolvedValue(profile);

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://test-api.com/uploads/avatar.jpg');

      // Mock pour FollowsRepository
      const mockFollowsRepository = { isFollowing: jest.fn().mockResolvedValue(null) };

      // Remplacer temporairement require pour retourner notre mock
      const originalRequire = require;
      global.require = jest.fn((path) => {
        if (path === '../repository/follows.repository') {
          return mockFollowsRepository;
        }
        return originalRequire(path);
      });

      // Appeler la méthode à tester
      const result = await ProfilesService.getProfileByUserID(userID);

      // Vérifier les résultats
      expect(ProfilesRepository.findByUserID).toHaveBeenCalledWith(userID);
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('avatar.jpg');

      expect(result).toEqual({
        userID,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test bio',
        avatar_url: 'http://test-api.com/uploads/avatar.jpg',
        score: 24,
        dataValues: {
          isFollowing: false
        }
      });

      // Restaurer l'espion et require
      buildAvatarUrlSpy.mockRestore();
      global.require = originalRequire;
    });

    it('devrait récupérer un profil avec le statut de follow', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const requestingUserID = 'requesting-user-id';
      const profile = {
        userID,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test bio',
        avatar_url: 'avatar.jpg',
        score: 24,
        dataValues: {}
      };

      ProfilesRepository.findByUserID.mockResolvedValue(profile);

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://test-api.com/uploads/avatar.jpg');

      // Mock pour FollowsRepository
      const mockFollowsRepository = { isFollowing: jest.fn().mockResolvedValue({ id: 'follow-id' }) };

      // Remplacer temporairement require pour retourner notre mock
      const originalRequire = require;
      global.require = jest.fn((path) => {
        if (path === '../repository/follows.repository') {
          return mockFollowsRepository;
        }
        return originalRequire(path);
      });

      // Appeler la méthode à tester
      const result = await ProfilesService.getProfileByUserID(userID, requestingUserID);

      // Vérifier les résultats
      expect(ProfilesRepository.findByUserID).toHaveBeenCalledWith(userID);
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('avatar.jpg');
      expect(mockFollowsRepository.isFollowing).toHaveBeenCalledWith(requestingUserID, userID);

      expect(result).toEqual({
        userID,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test bio',
        avatar_url: 'http://test-api.com/uploads/avatar.jpg',
        score: 24,
        dataValues: {
          isFollowing: true
        }
      });

      // Restaurer l'espion et require
      buildAvatarUrlSpy.mockRestore();
      global.require = originalRequire;
    });

    it('devrait mettre à jour le score si le score est 0', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const profile = {
        userID,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test bio',
        avatar_url: 'avatar.jpg',
        score: 0,
        dataValues: {}
      };

      const updatedProfile = {
        ...profile,
        score: 24
      };

      ProfilesRepository.findByUserID.mockResolvedValueOnce(profile).mockResolvedValueOnce(updatedProfile);

      // Mock pour UsersService
      const UsersService = {
        updateUserScore: jest.fn().mockResolvedValue()
      };

      // Mock require pour UsersService
      jest.mock('../src/services/users.service', () => UsersService, { virtual: true });

      // Mock pour FollowsRepository
      const mockFollowsRepository = { isFollowing: jest.fn().mockResolvedValue(null) };

      // Remplacer temporairement require pour retourner notre mock
      const originalRequire = require;
      global.require = jest.fn((path) => {
        if (path === '../repository/follows.repository') {
          return mockFollowsRepository;
        }
        return originalRequire(path);
      });

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://test-api.com/uploads/avatar.jpg');

      // Appeler la méthode à tester
      const result = await ProfilesService.getProfileByUserID(userID);

      // Vérifier les résultats
      expect(ProfilesRepository.findByUserID).toHaveBeenCalledWith(userID);
      expect(UsersService.updateUserScore).toHaveBeenCalledWith(userID);
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('avatar.jpg');

      expect(result).toEqual({
        userID,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'This is a test bio',
        avatar_url: 'http://test-api.com/uploads/avatar.jpg',
        score: 24,
        dataValues: {
          isFollowing: false
        }
      });

      // Restaurer l'espion et require
      buildAvatarUrlSpy.mockRestore();
      global.require = originalRequire;
    });

    it('devrait lever une erreur si le profil n\'existe pas', async () => {
      // Configurer les mocks
      const userID = 'nonexistent-user-id';

      ProfilesRepository.findByUserID.mockRejectedValue({ message: ErrorCodes.Profiles.NotFound });

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ProfilesService.getProfileByUserID(userID))
        .rejects.toEqual({ message: ErrorCodes.Profiles.NotFound });
    });
  });

  describe('updateAvatar', () => {
    it('devrait mettre à jour l\'avatar d\'un profil', async () => {
      // Configurer les mocks
      const userID = 'test-user-id';
      const file = { filename: 'new-avatar.jpg' };

      ProfilesRepository.findByUserID.mockResolvedValue({
        userID,
        avatar_url: 'old-avatar.jpg'
      });

      ProfilesRepository.updateAvatar.mockResolvedValue();

      // Espionner la méthode buildAvatarUrl
      const buildAvatarUrlSpy = jest.spyOn(ProfilesService, 'buildAvatarUrl');
      buildAvatarUrlSpy.mockReturnValue('http://test-api.com/uploads/new-avatar.jpg');

      // Appeler la méthode à tester
      const result = await ProfilesService.updateAvatar(userID, file);

      // Vérifier les résultats
      expect(ProfilesRepository.findByUserID).toHaveBeenCalledWith(userID);
      expect(ProfilesRepository.updateAvatar).toHaveBeenCalledWith(userID, 'new-avatar.jpg');
      expect(buildAvatarUrlSpy).toHaveBeenCalledWith('new-avatar.jpg');

      expect(result).toBe('http://test-api.com/uploads/new-avatar.jpg');

      // Restaurer l'espion
      buildAvatarUrlSpy.mockRestore();
    });

    it('devrait lever une erreur si le profil n\'existe pas', async () => {
      // Configurer les mocks
      const userID = 'nonexistent-user-id';
      const file = { filename: 'new-avatar.jpg' };

      ProfilesRepository.findByUserID.mockRejectedValue({ message: 'Profile not found' });

      // Appeler la méthode à tester et vérifier qu'elle lève une erreur
      await expect(ProfilesService.updateAvatar(userID, file))
        .rejects.toEqual({ message: 'Profile not found' });

      // Vérifier que la méthode updateAvatar n'a pas été appelée
      expect(ProfilesRepository.updateAvatar).not.toHaveBeenCalled();
    });
  });
});
