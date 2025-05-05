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
