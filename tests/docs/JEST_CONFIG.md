# Configuration de Jest pour BlinkerAPI

Ce document explique la configuration de Jest utilisée pour les tests de l'API Blinker.

## Fichier de configuration

Le fichier `jest.config.js` à la racine du projet contient la configuration de Jest :

```javascript
module.exports = {
  // Indique à Jest d'utiliser Node.js comme environnement de test
  testEnvironment: 'node',
  
  // Patterns pour trouver les fichiers de test
  testMatch: ['**/tests/**/*.test.js'],
  
  // Répertoires à ignorer lors des tests
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Timeout pour les tests (en millisecondes)
  testTimeout: 30000,
  
  // Afficher les détails des tests
  verbose: true,
  
  // Collecter la couverture de code
  collectCoverage: true,
  
  // Répertoires à inclure dans la couverture de code
  collectCoverageFrom: [
    'src/repository/**/*.js',
    'src/route/**/*.js',
    'src/services/**/*.js'
  ],
  
  // Répertoire où stocker les rapports de couverture
  coverageDirectory: 'coverage',
  
  // Format des rapports de couverture
  coverageReporters: ['text', 'lcov', 'clover'],
  
  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
```

## Options de configuration

### Environnement de test

```javascript
testEnvironment: 'node'
```

Cette option indique à Jest d'utiliser Node.js comme environnement de test. C'est l'option recommandée pour les applications Node.js.

### Patterns de fichiers de test

```javascript
testMatch: ['**/tests/**/*.test.js']
```

Cette option indique à Jest de rechercher les fichiers de test dans le dossier `tests` et ses sous-dossiers, avec l'extension `.test.js`.

### Répertoires ignorés

```javascript
testPathIgnorePatterns: ['/node_modules/']
```

Cette option indique à Jest d'ignorer les fichiers de test dans le dossier `node_modules`.

### Timeout des tests

```javascript
testTimeout: 30000
```

Cette option définit le timeout des tests à 30 secondes. Si un test prend plus de 30 secondes, il sera considéré comme échoué.

### Mode verbeux

```javascript
verbose: true
```

Cette option active le mode verbeux de Jest, qui affiche plus d'informations lors de l'exécution des tests.

### Couverture de code

```javascript
collectCoverage: true
```

Cette option active la collecte de la couverture de code lors de l'exécution des tests.

### Fichiers inclus dans la couverture

```javascript
collectCoverageFrom: [
  'src/repository/**/*.js',
  'src/route/**/*.js',
  'src/services/**/*.js'
]
```

Cette option indique à Jest de collecter la couverture de code pour les fichiers dans les dossiers `src/repository`, `src/route` et `src/services`.

### Répertoire de couverture

```javascript
coverageDirectory: 'coverage'
```

Cette option indique à Jest de stocker les rapports de couverture dans le dossier `coverage`.

### Format des rapports de couverture

```javascript
coverageReporters: ['text', 'lcov', 'clover']
```

Cette option indique à Jest de générer les rapports de couverture dans les formats suivants :
- `text` : rapport textuel affiché dans la console
- `lcov` : rapport au format LCOV, utilisé par de nombreux outils de couverture de code
- `clover` : rapport au format Clover, utilisé par certains outils d'intégration continue

### Seuils de couverture

```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50
  }
}
```

Cette option définit les seuils de couverture de code. Si la couverture est inférieure à ces seuils, les tests échoueront. Les seuils sont définis pour :
- `branches` : pourcentage de branches (if/else, switch/case, etc.) testées
- `functions` : pourcentage de fonctions testées
- `lines` : pourcentage de lignes de code testées
- `statements` : pourcentage d'instructions testées

## Options de ligne de commande

En plus de la configuration dans le fichier `jest.config.js`, vous pouvez utiliser des options de ligne de commande pour modifier le comportement de Jest :

### Mode watch

```bash
npx jest --watch
```

Cette option active le mode watch, qui relance automatiquement les tests lorsque les fichiers sont modifiés.

### Tests spécifiques

```bash
npx jest -t "nom du test"
```

Cette option exécute uniquement les tests dont le nom correspond à l'expression régulière spécifiée.

### Fichiers spécifiques

```bash
npx jest path/to/test.js
```

Cette option exécute uniquement les tests dans le fichier spécifié.

### Détection des connexions non fermées

```bash
npx jest --detectOpenHandles
```

Cette option détecte les connexions non fermées (comme les connexions à la base de données) après l'exécution des tests.

### Mode debug

```bash
npx jest --debug
```

Cette option active le mode debug, qui affiche plus d'informations sur l'exécution des tests.

## Scripts npm

Les scripts npm suivants sont disponibles pour exécuter les tests :

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:messages": "jest messages",
  "test:conversations": "jest conversations",
  "test:auth": "jest auth",
  "test:users": "jest users"
}
```

Ces scripts peuvent être exécutés avec la commande `npm run` :

```bash
npm run test
npm run test:watch
npm run test:coverage
npm run test:messages
npm run test:conversations
npm run test:auth
npm run test:users
```

## Conclusion

La configuration de Jest pour l'API Blinker est conçue pour faciliter l'écriture et l'exécution des tests, ainsi que pour fournir des informations utiles sur la couverture de code. En utilisant cette configuration, vous pouvez être sûr que vos tests sont exécutés de manière cohérente et que la qualité du code est maintenue.
