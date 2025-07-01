/**
 * Tests unitaires pour les utilitaires de validation
 */
const { isValidUUID, isValidURL, isValidEmail, isStrongPassword } = require('../../src/utils/validation.utils');

describe('Validation Utilities', () => {
    describe('isValidUUID', () => {
        it('devrait valider un UUID valide', () => {
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
            expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
        });

        it('devrait rejeter un UUID invalide', () => {
            expect(isValidUUID('not-a-uuid')).toBe(false);
            expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // trop court
            expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false); // trop long
            expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false); // caractère invalide
        });

        it('devrait rejeter les valeurs non-string', () => {
            expect(isValidUUID(null)).toBe(false);
            expect(isValidUUID(undefined)).toBe(false);
            expect(isValidUUID(123)).toBe(false);
            expect(isValidUUID({})).toBe(false);
        });
    });

    describe('isValidURL', () => {
        it('devrait valider une URL valide', () => {
            expect(isValidURL('https://example.com')).toBe(true);
            expect(isValidURL('http://localhost:3000')).toBe(true);
            expect(isValidURL('https://sub.domain.example.co.uk/path?query=string#hash')).toBe(true);
        });

        it('devrait rejeter une URL invalide', () => {
            expect(isValidURL('not-a-url')).toBe(false);
            expect(isValidURL('http:/example.com')).toBe(false); // manque un slash
            expect(isValidURL('example.com')).toBe(false); // manque le protocole
        });

        it('devrait rejeter les valeurs non-string', () => {
            expect(isValidURL(null)).toBe(false);
            expect(isValidURL(undefined)).toBe(false);
            expect(isValidURL(123)).toBe(false);
            expect(isValidURL({})).toBe(false);
        });
    });

    describe('isValidEmail', () => {
        it('devrait valider un email valide', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
            expect(isValidEmail('user-name@sub.domain.example')).toBe(true);
        });

        it('devrait rejeter un email invalide', () => {
            expect(isValidEmail('not-an-email')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user@example')).toBe(false); // manque le TLD
        });

        it('devrait rejeter les valeurs non-string', () => {
            expect(isValidEmail(null)).toBe(false);
            expect(isValidEmail(undefined)).toBe(false);
            expect(isValidEmail(123)).toBe(false);
            expect(isValidEmail({})).toBe(false);
        });
    });

    describe('isStrongPassword', () => {
        it('devrait valider un mot de passe fort avec les paramètres par défaut', () => {
            expect(isStrongPassword('StrongP@ssw0rd')).toBe(true);
            expect(isStrongPassword('Another$tr0ngPassword')).toBe(true);
        });

        it('devrait rejeter un mot de passe faible avec les paramètres par défaut', () => {
            expect(isStrongPassword('password')).toBe(false); // trop simple
            expect(isStrongPassword('Password1')).toBe(false); // pas de symbole
            expect(isStrongPassword('password!')).toBe(false); // pas de majuscule
            expect(isStrongPassword('PASSWORD!')).toBe(false); // pas de minuscule
            expect(isStrongPassword('Password!')).toBe(false); // pas de chiffre
            expect(isStrongPassword('Pas$w0')).toBe(false); // trop court
        });

        it('devrait respecter les options personnalisées', () => {
            // Mot de passe avec exigences réduites
            expect(isStrongPassword('Password1', {
                minLength: 8,
                requireSymbols: false
            })).toBe(true);

            // Mot de passe sans exigence de majuscule
            expect(isStrongPassword('password1!', {
                minLength: 8,
                requireUppercase: false
            })).toBe(true);
        });

        it('devrait rejeter les valeurs non-string', () => {
            expect(isStrongPassword(null)).toBe(false);
            expect(isStrongPassword(undefined)).toBe(false);
            expect(isStrongPassword(123)).toBe(false);
            expect(isStrongPassword({})).toBe(false);
        });
    });
});
