/**
 * Tests unitaires pour les utilitaires d'URL
 */
const { buildAvatarUrl } = require('../../src/utils/url.utils');

describe('URL Utilities', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Sauvegarder l'environnement original
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        // Restaurer l'environnement original
        process.env = originalEnv;
    });

    describe('buildAvatarUrl', () => {
        it('devrait retourner null si filename est null ou undefined', () => {
            expect(buildAvatarUrl(null)).toBeNull();
            expect(buildAvatarUrl(undefined)).toBeNull();
        });

        it('devrait utiliser API_URL si défini dans les variables d\'environnement', () => {
            process.env.API_URL = 'https://test-api.example.com';
            expect(buildAvatarUrl('avatar.jpg')).toBe('https://test-api.example.com/uploads/avatar.jpg');
        });

        it('devrait utiliser l\'URL de production si NODE_ENV est production et API_URL n\'est pas défini', () => {
            delete process.env.API_URL;
            process.env.NODE_ENV = 'production';
            expect(buildAvatarUrl('avatar.jpg')).toBe('https://dev.blinker.eterny.fr/uploads/avatar.jpg');
        });

        it('devrait utiliser l\'URL de développement par défaut si NODE_ENV n\'est pas production et API_URL n\'est pas défini', () => {
            delete process.env.API_URL;
            process.env.NODE_ENV = 'development';
            expect(buildAvatarUrl('avatar.jpg')).toBe('http://localhost:3011/uploads/avatar.jpg');
        });
    });
});
