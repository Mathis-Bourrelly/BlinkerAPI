# Bonnes pratiques pour les tests de BlinkerAPI

Ce document présente les bonnes pratiques à suivre pour écrire des tests efficaces et maintenables pour l'API Blinker.

## Organisation des tests

### Structure des fichiers

- Organisez les tests par domaine fonctionnel
- Utilisez des noms de fichiers descriptifs (ex: `messages.repository.test.js`)
- Placez tous les tests dans le dossier `tests`
- Suivez la même structure de dossiers que le code source

### Structure des tests

- Utilisez `describe` pour regrouper les tests par fonctionnalité
- Utilisez `it` pour décrire le comportement attendu
- Utilisez des noms de tests descriptifs
- Suivez le pattern AAA (Arrange, Act, Assert) :
  - **Arrange** : Préparez les données et les mocks
  - **Act** : Exécutez le code à tester
  - **Assert** : Vérifiez les résultats

Exemple :

```javascript
describe('MessagesRepository', () => {
  describe('getConversationMessages', () => {
    it('devrait récupérer les messages avec les informations de l\'expéditeur', async () => {
      // Arrange
      const conversationID = 'test-conversation-id';
      
      // Act
      const messages = await MessagesRepository.getConversationMessages(conversationID);
      
      // Assert
      expect(messages.length).toBeGreaterThan(0);
      messages.forEach(message => {
        expect(message.senderID).toBeDefined();
        expect(message.sender).toBeDefined();
      });
    });
  });
});
```

## Isolation des tests

### Indépendance des tests

- Chaque test doit être indépendant des autres tests
- Évitez les dépendances entre les tests
- Utilisez `beforeEach` et `afterEach` pour initialiser et nettoyer l'environnement de test
- Utilisez `beforeAll` et `afterAll` pour les opérations coûteuses qui peuvent être partagées entre les tests

### Mocking

- Utilisez des mocks pour isoler le code testé de ses dépendances
- Utilisez `jest.mock()` pour mocker des modules entiers
- Utilisez `jest.spyOn()` pour espionner des méthodes spécifiques
- Utilisez `mockResolvedValue()` et `mockRejectedValue()` pour les promesses
- Utilisez `mockImplementation()` pour des implémentations personnalisées
- Restaurez les mocks après les tests avec `mockRestore()`

Exemple :

```javascript
// Mock d'un module entier
jest.mock('./messages.service.js', () => ({
  getConversationMessages: jest.fn(),
  sendMessage: jest.fn(),
  getUnreadMessages: jest.fn()
}));

// Espionnage d'une méthode
const getConversationMessagesSpy = jest.spyOn(MessagesService, 'getConversationMessages');
getConversationMessagesSpy.mockResolvedValue([/* messages */]);

// Restauration du spy
getConversationMessagesSpy.mockRestore();
```

### Base de données

- Utilisez une base de données de test séparée
- Nettoyez la base de données avant et après les tests
- Utilisez des transactions pour isoler les tests
- Utilisez des mocks pour éviter d'accéder à la base de données dans les tests unitaires

## Tests asynchrones

### Promesses

- Utilisez `async/await` pour les tests asynchrones
- Retournez toujours une promesse dans les tests asynchrones
- Utilisez `try/catch` pour capturer les erreurs dans les tests asynchrones
- Utilisez `expect().resolves` et `expect().rejects` pour tester les promesses

Exemple :

```javascript
it('devrait récupérer les messages d\'une conversation', async () => {
  // Test asynchrone avec async/await
  const messages = await MessagesRepository.getConversationMessages('test-conversation-id');
  expect(messages).toBeDefined();
});

it('devrait lever une erreur si la conversation n\'existe pas', async () => {
  // Test asynchrone avec expect().rejects
  await expect(MessagesRepository.getConversationMessages('nonexistent-id'))
    .rejects.toEqual({ message: 'Conversation non trouvée' });
});
```

### Timeouts

- Utilisez `jest.setTimeout()` pour augmenter le timeout des tests longs
- Évitez les tests qui prennent trop de temps
- Utilisez des mocks pour accélérer les tests

## Assertions

### Types d'assertions

- Utilisez `toBe()` pour les types primitifs
- Utilisez `toEqual()` pour les objets et les tableaux
- Utilisez `toBeInstanceOf()` pour vérifier le type d'un objet
- Utilisez `toHaveProperty()` pour vérifier la présence d'une propriété
- Utilisez `toHaveBeenCalled()` pour vérifier qu'une fonction a été appelée
- Utilisez `toHaveBeenCalledWith()` pour vérifier les arguments d'une fonction
- Utilisez `toThrow()` pour vérifier qu'une fonction lève une erreur

### Assertions personnalisées

- Utilisez `expect.extend()` pour créer des assertions personnalisées
- Utilisez `expect.any()` pour vérifier le type d'une valeur
- Utilisez `expect.arrayContaining()` pour vérifier qu'un tableau contient certains éléments
- Utilisez `expect.objectContaining()` pour vérifier qu'un objet contient certaines propriétés

Exemple :

```javascript
// Vérifier qu'un objet a une certaine structure
expect(message).toEqual(expect.objectContaining({
  messageID: expect.any(String),
  content: 'Test message',
  senderID: 'test-sender-id',
  sender: expect.objectContaining({
    userID: 'test-sender-id',
    email: expect.any(String)
  })
}));
```

## Couverture de code

### Objectifs de couverture

- Visez une couverture de code d'au moins 80%
- Concentrez-vous sur la couverture des branches (if/else, switch/case, etc.)
- Identifiez les parties critiques du code qui nécessitent une couverture plus élevée
- Ne sacrifiez pas la qualité des tests pour augmenter la couverture

### Rapport de couverture

- Exécutez les tests avec l'option `--coverage` pour générer un rapport de couverture
- Analysez le rapport pour identifier les parties du code non testées
- Ajoutez des tests pour les parties du code non testées
- Intégrez la couverture de code dans votre processus d'intégration continue

## Tests de bout en bout

### Supertest

- Utilisez Supertest pour tester les routes HTTP
- Configurez une application Express pour les tests
- Utilisez des mocks pour les dépendances
- Vérifiez les codes de statut HTTP et les corps de réponse

Exemple :

```javascript
const request = require('supertest');
const express = require('express');
const messagesRoutes = require('../src/route/messages.route');

describe('Messages Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/messages', messagesRoutes.initializeRoutes());
  });

  it('devrait récupérer les messages d\'une conversation', async () => {
    const response = await request(app)
      .get('/messages/conversation/test-conversation-id')
      .expect(200);
    
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('content', 'Hello');
  });
});
```

## Maintenance des tests

### Refactoring

- Mettez à jour les tests lorsque vous refactorisez le code
- Utilisez des mocks pour faciliter le refactoring
- Exécutez les tests après chaque refactoring
- Utilisez les tests comme documentation du code

### Documentation

- Documentez les tests avec des commentaires
- Utilisez des noms de tests descriptifs
- Expliquez les cas de test complexes
- Documentez les mocks et les fixtures

### Intégration continue

- Exécutez les tests dans votre pipeline d'intégration continue
- Configurez les tests pour échouer rapidement
- Générez des rapports de couverture de code
- Utilisez les tests comme critère de qualité pour les pull requests

## Conclusion

Suivre ces bonnes pratiques vous aidera à écrire des tests efficaces et maintenables pour l'API Blinker. Les tests sont un investissement qui paie sur le long terme en réduisant les régressions et en facilitant la maintenance du code.
