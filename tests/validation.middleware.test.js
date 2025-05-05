/**
 * Tests unitaires pour les middlewares de validation
 * Ces tests vérifient que les validations fonctionnent correctement
 */

const { validationResult, body } = require('express-validator');
const express = require('express');
const request = require('supertest');

// Créer une application Express pour les tests
const createApp = (validations) => {
  const app = express();
  app.use(express.json());
  
  app.post('/test', validations, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return res.status(200).json({ success: true });
  });
  
  return app;
};

describe('Validation Middleware', () => {
  describe('Email Validation', () => {
    const emailValidation = [
      body('email').isEmail().withMessage("L'email doit être valide")
    ];
    
    it('devrait accepter un email valide', async () => {
      const app = createApp(emailValidation);
      const response = await request(app)
        .post('/test')
        .send({ email: 'test@example.com' })
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    it('devrait rejeter un email invalide', async () => {
      const app = createApp(emailValidation);
      const response = await request(app)
        .post('/test')
        .send({ email: 'invalid-email' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("L'email doit être valide");
    });
    
    it('devrait rejeter un email vide', async () => {
      const app = createApp(emailValidation);
      const response = await request(app)
        .post('/test')
        .send({ email: '' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
    });
  });
  
  describe('Password Validation', () => {
    const passwordValidation = [
      body('password').isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      }).withMessage("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole")
    ];
    
    it('devrait accepter un mot de passe fort', async () => {
      const app = createApp(passwordValidation);
      const response = await request(app)
        .post('/test')
        .send({ password: 'StrongP@ssw0rd123' })
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    it('devrait rejeter un mot de passe trop court', async () => {
      const app = createApp(passwordValidation);
      const response = await request(app)
        .post('/test')
        .send({ password: 'Short1@' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole");
    });
    
    it('devrait rejeter un mot de passe sans majuscule', async () => {
      const app = createApp(passwordValidation);
      const response = await request(app)
        .post('/test')
        .send({ password: 'strongp@ssw0rd123' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
    });
    
    it('devrait rejeter un mot de passe sans minuscule', async () => {
      const app = createApp(passwordValidation);
      const response = await request(app)
        .post('/test')
        .send({ password: 'STRONGP@SSW0RD123' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
    });
    
    it('devrait rejeter un mot de passe sans chiffre', async () => {
      const app = createApp(passwordValidation);
      const response = await request(app)
        .post('/test')
        .send({ password: 'StrongP@ssword' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
    });
    
    it('devrait rejeter un mot de passe sans symbole', async () => {
      const app = createApp(passwordValidation);
      const response = await request(app)
        .post('/test')
        .send({ password: 'StrongPassw0rd' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
    });
  });
  
  describe('Required Field Validation', () => {
    const requiredFieldValidation = [
      body('username').notEmpty().withMessage("Le nom d'utilisateur est requis"),
      body('email').notEmpty().withMessage("L'email est requis"),
      body('password').notEmpty().withMessage("Le mot de passe est requis")
    ];
    
    it('devrait accepter une requête avec tous les champs requis', async () => {
      const app = createApp(requiredFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    it('devrait rejeter une requête avec un champ manquant', async () => {
      const app = createApp(requiredFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({
          username: 'testuser',
          email: 'test@example.com'
          // password manquant
        })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("Le mot de passe est requis");
    });
    
    it('devrait rejeter une requête avec plusieurs champs manquants', async () => {
      const app = createApp(requiredFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({
          username: 'testuser'
          // email et password manquants
        })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(2);
    });
  });
  
  describe('Optional Field Validation', () => {
    const optionalFieldValidation = [
      body('email').optional().isEmail().withMessage("L'email doit être valide"),
      body('age').optional().isInt({ min: 18 }).withMessage("L'âge doit être un entier supérieur ou égal à 18")
    ];
    
    it('devrait accepter une requête sans champs optionnels', async () => {
      const app = createApp(optionalFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({})
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    it('devrait accepter une requête avec des champs optionnels valides', async () => {
      const app = createApp(optionalFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({
          email: 'test@example.com',
          age: 25
        })
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    it('devrait rejeter une requête avec un champ optionnel invalide', async () => {
      const app = createApp(optionalFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({
          email: 'invalid-email',
          age: 25
        })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("L'email doit être valide");
    });
    
    it('devrait rejeter une requête avec plusieurs champs optionnels invalides', async () => {
      const app = createApp(optionalFieldValidation);
      const response = await request(app)
        .post('/test')
        .send({
          email: 'invalid-email',
          age: 16
        })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(2);
    });
  });
  
  describe('Custom Validation', () => {
    const customValidation = [
      body('username')
        .notEmpty().withMessage("Le nom d'utilisateur est requis")
        .isLength({ min: 3, max: 20 }).withMessage("Le nom d'utilisateur doit contenir entre 3 et 20 caractères")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores")
    ];
    
    it('devrait accepter un nom d\'utilisateur valide', async () => {
      const app = createApp(customValidation);
      const response = await request(app)
        .post('/test')
        .send({ username: 'valid_username123' })
        .expect(200);
      
      expect(response.body).toEqual({ success: true });
    });
    
    it('devrait rejeter un nom d\'utilisateur trop court', async () => {
      const app = createApp(customValidation);
      const response = await request(app)
        .post('/test')
        .send({ username: 'ab' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("Le nom d'utilisateur doit contenir entre 3 et 20 caractères");
    });
    
    it('devrait rejeter un nom d\'utilisateur trop long', async () => {
      const app = createApp(customValidation);
      const response = await request(app)
        .post('/test')
        .send({ username: 'a'.repeat(21) })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("Le nom d'utilisateur doit contenir entre 3 et 20 caractères");
    });
    
    it('devrait rejeter un nom d\'utilisateur avec des caractères spéciaux', async () => {
      const app = createApp(customValidation);
      const response = await request(app)
        .post('/test')
        .send({ username: 'invalid@username' })
        .expect(400);
      
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].msg).toBe("Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores");
    });
  });
});
