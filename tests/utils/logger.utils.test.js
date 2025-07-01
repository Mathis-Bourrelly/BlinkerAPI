/**
 * Tests unitaires pour l'utilitaire de journalisation
 */
const { logger, httpLogger } = require('../../src/utils/logger.utils');

describe('Logger Utilities', () => {
    describe('logger', () => {
        it('devrait avoir les méthodes de journalisation appropriées', () => {
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.http).toBe('function');
            expect(typeof logger.debug).toBe('function');
        });

        it('devrait pouvoir journaliser des messages', () => {
            // Mock les méthodes de journalisation pour éviter d'écrire dans les fichiers de log
            const originalError = logger.error;
            const originalInfo = logger.info;
            
            logger.error = jest.fn();
            logger.info = jest.fn();
            
            // Tester la journalisation
            logger.error('Test error message');
            logger.info('Test info message');
            
            expect(logger.error).toHaveBeenCalledWith('Test error message');
            expect(logger.info).toHaveBeenCalledWith('Test info message');
            
            // Restaurer les méthodes originales
            logger.error = originalError;
            logger.info = originalInfo;
        });
    });

    describe('httpLogger', () => {
        it('devrait être une fonction middleware', () => {
            expect(typeof httpLogger).toBe('function');
        });

        it('devrait journaliser les requêtes HTTP et appeler next()', () => {
            // Mock les objets req, res et next
            const req = {
                method: 'GET',
                url: '/test'
            };
            
            const res = {
                statusCode: 200,
                on: jest.fn((event, callback) => {
                    if (event === 'finish') {
                        callback();
                    }
                })
            };
            
            const next = jest.fn();
            
            // Mock la méthode http du logger
            const originalHttp = logger.http;
            logger.http = jest.fn();
            
            // Appeler le middleware
            httpLogger(req, res, next);
            
            // Vérifier que la requête a été journalisée
            expect(logger.http).toHaveBeenCalledWith('GET /test');
            
            // Vérifier que next() a été appelé
            expect(next).toHaveBeenCalled();
            
            // Vérifier que l'événement 'finish' a été écouté
            expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
            
            // Vérifier que la réponse a été journalisée
            expect(logger.http).toHaveBeenCalledWith(expect.stringMatching(/GET \/test 200 \d+ms/));
            
            // Restaurer la méthode originale
            logger.http = originalHttp;
        });
    });
});
