/**
 * Tests unitaires pour les utilitaires de pagination
 */
const { calculateOffset, normalizePaginationParams, formatPaginatedResponse } = require('../../src/utils/pagination.utils');

describe('Pagination Utilities', () => {
    describe('calculateOffset', () => {
        it('devrait calculer l\'offset correctement', () => {
            expect(calculateOffset(1, 10)).toBe(0);
            expect(calculateOffset(2, 10)).toBe(10);
            expect(calculateOffset(3, 15)).toBe(30);
        });

        it('devrait gérer les valeurs de page inférieures à 1', () => {
            expect(calculateOffset(0, 10)).toBe(0);
            expect(calculateOffset(-1, 10)).toBe(0);
        });
    });

    describe('normalizePaginationParams', () => {
        it('devrait normaliser les paramètres de pagination', () => {
            expect(normalizePaginationParams({ page: 2, limit: 20 })).toEqual({
                page: 2,
                limit: 20,
                offset: 20
            });
        });

        it('devrait utiliser les valeurs par défaut si non fournies', () => {
            expect(normalizePaginationParams({})).toEqual({
                page: 1,
                limit: 10,
                offset: 0
            });
        });

        it('devrait convertir les chaînes en nombres', () => {
            expect(normalizePaginationParams({ page: '2', limit: '20' })).toEqual({
                page: 2,
                limit: 20,
                offset: 20
            });
        });

        it('devrait gérer les valeurs invalides', () => {
            expect(normalizePaginationParams({ page: 'abc', limit: 'xyz' })).toEqual({
                page: 1,
                limit: 10,
                offset: 0
            });
        });

        it('devrait respecter la limite maximale', () => {
            expect(normalizePaginationParams({ limit: 200, maxLimit: 100 })).toEqual({
                page: 1,
                limit: 100,
                offset: 0
            });
        });

        it('devrait garantir que page et limit sont positifs', () => {
            expect(normalizePaginationParams({ page: -1, limit: -10 })).toEqual({
                page: 1,
                limit: 1,
                offset: 0
            });
        });
    });

    describe('formatPaginatedResponse', () => {
        it('devrait formater correctement la réponse paginée', () => {
            const response = formatPaginatedResponse({
                page: 2,
                limit: 10,
                total: 25,
                data: [1, 2, 3, 4, 5]
            });

            expect(response).toEqual({
                page: 2,
                limit: 10,
                total: 25,
                totalPages: 3,
                hasNextPage: true,
                hasPrevPage: true,
                data: [1, 2, 3, 4, 5]
            });
        });

        it('devrait calculer correctement hasNextPage et hasPrevPage', () => {
            // Première page avec plusieurs pages
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 25, data: [] }).hasNextPage).toBe(true);
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 25, data: [] }).hasPrevPage).toBe(false);

            // Dernière page
            expect(formatPaginatedResponse({ page: 3, limit: 10, total: 25, data: [] }).hasNextPage).toBe(false);
            expect(formatPaginatedResponse({ page: 3, limit: 10, total: 25, data: [] }).hasPrevPage).toBe(true);

            // Page du milieu
            expect(formatPaginatedResponse({ page: 2, limit: 10, total: 25, data: [] }).hasNextPage).toBe(true);
            expect(formatPaginatedResponse({ page: 2, limit: 10, total: 25, data: [] }).hasPrevPage).toBe(true);

            // Une seule page
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 5, data: [] }).hasNextPage).toBe(false);
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 5, data: [] }).hasPrevPage).toBe(false);
        });

        it('devrait calculer correctement le nombre total de pages', () => {
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 25, data: [] }).totalPages).toBe(3);
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 10, data: [] }).totalPages).toBe(1);
            expect(formatPaginatedResponse({ page: 1, limit: 10, total: 0, data: [] }).totalPages).toBe(0);
            expect(formatPaginatedResponse({ page: 1, limit: 5, total: 11, data: [] }).totalPages).toBe(3);
        });
    });
});
