/**
 * Tests unitaires pour le middleware d'authentification
 * Ces tests vérifient que le middleware d'authentification fonctionne correctement
 */

const jwt = require('jsonwebtoken');
const authMiddleware = require('../src/core/middlewares/authMiddleware');
const userService = require('../src/services/users.service');

// Mocks pour les dépendances
jest.mock('jsonwebtoken');
jest.mock('../src/services/users.service');

describe('AuthMiddleware', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer l'environnement pour les tests
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('verifyToken', () => {
    it('devrait extraire le token et appeler next() si le token est valide', () => {
      // Configurer les mocks
      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      jwt.verify.mockReturnValue({
        userID: 'test-user-id',
        email: 'test@example.com'
      });

      // Appeler la méthode à tester
      authMiddleware.verifyToken(req, res, next);

      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(req.user).toEqual({
        userID: 'test-user-id',
        email: 'test@example.com'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('devrait retourner une erreur 401 si aucun token n\'est fourni', () => {
      // Configurer les mocks
      const req = {
        headers: {}
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();

      // Appeler la méthode à tester
      authMiddleware.verifyToken(req, res, next);

      // Vérifier les résultats
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Accès non autorisé : Aucun token fourni" });
    });

    it('devrait retourner une erreur 401 si le token n\'est pas au format Bearer', () => {
      // Configurer les mocks
      const req = {
        headers: {
          authorization: 'invalid-format'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();

      // Appeler la méthode à tester
      authMiddleware.verifyToken(req, res, next);

      // Vérifier les résultats
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Accès non autorisé : Aucun token fourni" });
    });

    it('devrait retourner une erreur 401 si le token est invalide', () => {
      // Configurer les mocks
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Token invalide');
      });

      // Appeler la méthode à tester
      authMiddleware.verifyToken(req, res, next);

      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Token invalide ou expiré" });
    });
  });

  describe('checkVerifiedUser', () => {
    it('devrait appeler next() si l\'utilisateur est vérifié', async () => {
      // Configurer les mocks
      const req = {
        user: {
          userID: 'test-user-id'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      userService.getUserById.mockResolvedValue({
        userID: 'test-user-id',
        isVerified: true
      });

      // Appeler la méthode à tester
      await authMiddleware.checkVerifiedUser(req, res, next);

      // Vérifier les résultats
      expect(userService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('devrait retourner une erreur 401 si l\'utilisateur n\'est pas défini', async () => {
      // Configurer les mocks
      const req = {};
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();

      // Appeler la méthode à tester
      await authMiddleware.checkVerifiedUser(req, res, next);

      // Vérifier les résultats
      expect(userService.getUserById).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Accès non autorisé : Identité utilisateur inconnue" });
    });

    it('devrait retourner une erreur 404 si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      const req = {
        user: {
          userID: 'nonexistent-user-id'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      userService.getUserById.mockResolvedValue(null);

      // Appeler la méthode à tester
      await authMiddleware.checkVerifiedUser(req, res, next);

      // Vérifier les résultats
      expect(userService.getUserById).toHaveBeenCalledWith('nonexistent-user-id');
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
    });

    it('devrait retourner une erreur 403 si l\'utilisateur n\'est pas vérifié', async () => {
      // Configurer les mocks
      const req = {
        user: {
          userID: 'test-user-id'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const next = jest.fn();
      
      userService.getUserById.mockResolvedValue({
        userID: 'test-user-id',
        isVerified: false
      });

      // Appeler la méthode à tester
      await authMiddleware.checkVerifiedUser(req, res, next);

      // Vérifier les résultats
      expect(userService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Votre compte n'est pas encore vérifié." });
    });
  });
});
