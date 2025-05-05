# Tests pour BlinkerAPI

Ce dossier contient les tests unitaires et d'intégration pour l'API Blinker. Ces tests permettent de vérifier le bon fonctionnement des différentes parties de l'application et de détecter les régressions lors des modifications du code.

## Structure des tests

Les tests sont organisés par domaine fonctionnel :

- `messages.repository.test.js` : Tests pour le repository de messages
- `messages.controller.test.js` : Tests pour le contrôleur de messages
- `messages.route.test.js` : Tests pour les routes de messages
- `conversations.service.test.js` : Tests pour le service de conversations
- `login.service.test.js` : Tests pour le service d'authentification
- `auth.middleware.test.js` : Tests pour le middleware d'authentification
- `users.repository.test.js` : Tests pour le repository d'utilisateurs

## Exécution des tests

Pour exécuter tous les tests :

```bash
npm test
```

Pour exécuter les tests avec le mode watch (relance automatique des tests lors des modifications) :

```bash
npm run test:watch
```

Pour exécuter les tests avec la couverture de code :

```bash
npm run test:coverage
```

Pour exécuter les tests d'un domaine spécifique :

```bash
npm run test:messages    # Tests liés aux messages
npm run test:conversations # Tests liés aux conversations
npm run test:auth        # Tests liés à l'authentification
npm run test:users       # Tests liés aux utilisateurs
```

## Ajout de nouveaux tests

Pour ajouter de nouveaux tests :

1. Créez un fichier de test dans le dossier `tests` avec le suffixe `.test.js`
2. Importez les modules nécessaires
3. Utilisez les fonctions de Jest (`describe`, `it`, `expect`, etc.) pour écrire vos tests
4. Exécutez les tests pour vérifier qu'ils fonctionnent correctement

Exemple de structure de test :

```javascript
/**
 * Tests unitaires pour [composant testé]
 * Ces tests vérifient [fonctionnalité testée]
 */

// Importer les modules nécessaires
const ModuleToTest = require('../src/path/to/module');

describe('NomDuModule', () => {
  // Configuration avant les tests
  beforeEach(() => {
    // Initialisation avant chaque test
  });

  // Nettoyage après les tests
  afterEach(() => {
    // Nettoyage après chaque test
  });

  describe('nomDeLaFonction', () => {
    it('devrait faire quelque chose de spécifique', async () => {
      // Arrangement (setup)
      const input = 'test';
      
      // Action
      const result = await ModuleToTest.nomDeLaFonction(input);
      
      // Assertion
      expect(result).toBe('résultat attendu');
    });
  });
});
```

## Bonnes pratiques

- Chaque test doit être indépendant des autres tests
- Utilisez des mocks pour isoler le code testé de ses dépendances
- Testez les cas normaux et les cas d'erreur
- Nommez vos tests de manière descriptive
- Organisez vos tests par fonctionnalité
- Utilisez `beforeEach` et `afterEach` pour initialiser et nettoyer l'environnement de test
- Utilisez `beforeAll` et `afterAll` pour les opérations coûteuses qui peuvent être partagées entre les tests

## Dépannage

### Problèmes courants

1. **Erreurs de connexion à la base de données** : Vérifiez que la base de données est accessible et que les informations de connexion sont correctes.

2. **Tests asynchrones qui échouent** : Assurez-vous d'utiliser correctement `async/await` ou les promesses dans vos tests.

3. **Erreurs "Cannot log after tests are done"** : Ces erreurs se produisent généralement lorsque des opérations asynchrones continuent après la fin du test. Assurez-vous de fermer correctement toutes les connexions et d'attendre que toutes les promesses soient résolues.

4. **Mocks qui ne fonctionnent pas** : Vérifiez que vous avez correctement configuré les mocks et que vous les avez placés avant l'importation des modules qui les utilisent.

### Résolution des problèmes

Si vous rencontrez des problèmes avec les tests :

1. Exécutez les tests avec l'option `--verbose` pour obtenir plus d'informations :
   ```bash
   npx jest --verbose
   ```

2. Utilisez l'option `--detectOpenHandles` pour détecter les connexions non fermées :
   ```bash
   npx jest --detectOpenHandles
   ```

3. Exécutez un seul test à la fois pour isoler le problème :
   ```bash
   npx jest -t "nom du test"
   ```
