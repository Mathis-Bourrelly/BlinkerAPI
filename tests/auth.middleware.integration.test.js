/**
 * Tests d'intégration pour le middleware d'authentification
 * Ces tests vérifient que le middleware d'authentification fonctionne correctement dans un contexte d'application Express
 */

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const AuthMiddleware = require('../src/core/middlewares/authMiddleware');
const UsersService = require('../src/services/users.service');

// Mocks pour les dépendances
jest.mock('jsonwebtoken');
jest.mock('../src/services/users.service');

describe('AuthMiddleware Integration', () => {
  let app;
  
  // Configurer l'application Express avant chaque test
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Configurer l'environnement pour les tests
    process.env.JWT_SECRET = 'test-secret';
    
    // Créer une application Express
    app = express();
    app.use(express.json());
    
    // Configurer les routes de test
    app.get('/protected', AuthMiddleware.verifyToken, (req, res) => {
      res.status(200).json({ user: req.user });
    });
    
    app.get('/verified', AuthMiddleware.verifyToken, AuthMiddleware.checkVerifiedUser, (req, res) => {
      res.status(200).json({ message: 'Accès autorisé' });
    });
  });
  
  describe('verifyToken Middleware', () => {
    it('devrait autoriser l\'accès avec un token valide', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com'
      };
      
      jwt.verify.mockReturnValue(mockUser);
      
      // Effectuer la requête
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(response.body).toEqual({ user: mockUser });
    });
    
    it('devrait refuser l\'accès sans token', async () => {
      // Effectuer la requête
      const response = await request(app)
        .get('/protected')
        .expect(401);
      
      // Vérifier les résultats
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(response.body).toEqual({ error: 'Accès non autorisé : Aucun token fourni' });
    });
    
    it('devrait refuser l\'accès avec un token invalide', async () => {
      // Configurer les mocks
      jwt.verify.mockImplementation(() => {
        throw new Error('Token invalide');
      });
      
      // Effectuer la requête
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
      expect(response.body).toEqual({ error: 'Token invalide ou expiré' });
    });
    
    it('devrait refuser l\'accès avec un format de token incorrect', async () => {
      // Effectuer la requête
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
      
      // Vérifier les résultats
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(response.body).toEqual({ error: 'Accès non autorisé : Aucun token fourni' });
    });
  });
  
  describe('checkVerifiedUser Middleware', () => {
    it('devrait autoriser l\'accès pour un utilisateur vérifié', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com'
      };
      
      jwt.verify.mockReturnValue(mockUser);
      UsersService.getUserById.mockResolvedValue({
        userID: 'test-user-id',
        email: 'test@example.com',
        isVerified: true
      });
      
      // Effectuer la requête
      const response = await request(app)
        .get('/verified')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(UsersService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(response.body).toEqual({ message: 'Accès autorisé' });
    });
    
    it('devrait refuser l\'accès pour un utilisateur non vérifié', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com'
      };
      
      jwt.verify.mockReturnValue(mockUser);
      UsersService.getUserById.mockResolvedValue({
        userID: 'test-user-id',
        email: 'test@example.com',
        isVerified: false
      });
      
      // Effectuer la requête
      const response = await request(app)
        .get('/verified')
        .set('Authorization', 'Bearer valid-token')
        .expect(403);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(UsersService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(response.body).toEqual({ error: 'Votre compte n\'est pas encore vérifié.' });
    });
    
    it('devrait refuser l\'accès si l\'utilisateur n\'existe pas', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'nonexistent-user-id',
        email: 'test@example.com'
      };
      
      jwt.verify.mockReturnValue(mockUser);
      UsersService.getUserById.mockResolvedValue(null);
      
      // Effectuer la requête
      const response = await request(app)
        .get('/verified')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(UsersService.getUserById).toHaveBeenCalledWith('nonexistent-user-id');
      expect(response.body).toEqual({ error: 'Utilisateur non trouvé' });
    });
    
    it('devrait gérer les erreurs internes', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com'
      };
      
      jwt.verify.mockReturnValue(mockUser);
      UsersService.getUserById.mockRejectedValue(new Error('Database error'));
      
      // Effectuer la requête
      const response = await request(app)
        .get('/verified')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(UsersService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(response.body).toEqual({ error: 'Erreur interne du serveur' });
    });
  });
  
  describe('Middleware Chain', () => {
    it('devrait exécuter les middlewares dans l\'ordre', async () => {
      // Configurer les mocks
      const mockUser = {
        userID: 'test-user-id',
        email: 'test@example.com'
      };
      
      jwt.verify.mockReturnValue(mockUser);
      UsersService.getUserById.mockResolvedValue({
        userID: 'test-user-id',
        email: 'test@example.com',
        isVerified: true
      });
      
      // Créer une application avec plusieurs middlewares
      const chainApp = express();
      
      // Espionner les appels de middleware
      const spy1 = jest.fn((req, res, next) => next());
      const spy2 = jest.fn((req, res, next) => next());
      
      chainApp.get('/chain',
        AuthMiddleware.verifyToken,
        spy1,
        AuthMiddleware.checkVerifiedUser,
        spy2,
        (req, res) => res.status(200).json({ success: true })
      );
      
      // Effectuer la requête
      await request(chainApp)
        .get('/chain')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      // Vérifier que les middlewares ont été appelés dans l'ordre
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(spy1).toHaveBeenCalled();
      expect(UsersService.getUserById).toHaveBeenCalledWith('test-user-id');
      expect(spy2).toHaveBeenCalled();
    });
    
    it('devrait arrêter la chaîne si un middleware échoue', async () => {
      // Configurer les mocks
      jwt.verify.mockImplementation(() => {
        throw new Error('Token invalide');
      });
      
      // Créer une application avec plusieurs middlewares
      const chainApp = express();
      
      // Espionner les appels de middleware
      const spy1 = jest.fn((req, res, next) => next());
      const spy2 = jest.fn((req, res, next) => next());
      
      chainApp.get('/chain',
        AuthMiddleware.verifyToken,
        spy1,
        AuthMiddleware.checkVerifiedUser,
        spy2,
        (req, res) => res.status(200).json({ success: true })
      );
      
      // Effectuer la requête
      await request(chainApp)
        .get('/chain')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      // Vérifier que seul le premier middleware a été appelé
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
      expect(spy1).not.toHaveBeenCalled();
      expect(UsersService.getUserById).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
    });
  });
});
