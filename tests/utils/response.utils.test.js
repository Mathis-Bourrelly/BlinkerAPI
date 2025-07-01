/**
 * Tests unitaires pour les utilitaires de réponse API
 */
const { successResponse, errorResponse, withStandardResponse, errorHandler } = require('../../src/utils/response.utils');

describe('Response Utilities', () => {
    describe('successResponse', () => {
        it('devrait créer une réponse de succès avec les valeurs par défaut', () => {
            const response = successResponse({ data: { id: 1, name: 'Test' } });
            expect(response).toEqual({
                success: true,
                status: 200,
                message: 'Opération réussie',
                data: { id: 1, name: 'Test' }
            });
        });

        it('devrait créer une réponse de succès avec les valeurs personnalisées', () => {
            const response = successResponse({
                data: { id: 1 },
                message: 'Ressource créée',
                status: 201
            });
            expect(response).toEqual({
                success: true,
                status: 201,
                message: 'Ressource créée',
                data: { id: 1 }
            });
        });
    });

    describe('errorResponse', () => {
        it('devrait créer une réponse d\'erreur avec les valeurs par défaut', () => {
            const response = errorResponse({ message: 'Erreur de validation' });
            expect(response).toEqual({
                success: false,
                status: 400,
                message: 'Erreur de validation',
                errors: null
            });
        });

        it('devrait créer une réponse d\'erreur avec les valeurs personnalisées', () => {
            const errors = [{ field: 'name', message: 'Le nom est requis' }];
            const response = errorResponse({
                message: 'Erreur de validation',
                errors,
                status: 422
            });
            expect(response).toEqual({
                success: false,
                status: 422,
                message: 'Erreur de validation',
                errors
            });
        });
    });

    describe('withStandardResponse', () => {
        it('devrait envelopper un gestionnaire de route et renvoyer une réponse standardisée', async () => {
            const mockHandler = jest.fn().mockResolvedValue({ id: 1, name: 'Test' });
            const mockReq = {};
            const mockRes = {
                headersSent: false,
                statusCode: 200,
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            const wrappedHandler = withStandardResponse(mockHandler);
            await wrappedHandler(mockReq, mockRes, mockNext);

            expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                status: 200,
                message: 'Opération réussie',
                data: { id: 1, name: 'Test' }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('ne devrait pas envoyer de réponse si les en-têtes ont déjà été envoyés', async () => {
            const mockHandler = jest.fn().mockResolvedValue({ id: 1 });
            const mockReq = {};
            const mockRes = {
                headersSent: true,
                status: jest.fn(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            const wrappedHandler = withStandardResponse(mockHandler);
            await wrappedHandler(mockReq, mockRes, mockNext);

            expect(mockHandler).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });

        it('devrait passer les erreurs au middleware next', async () => {
            const mockError = new Error('Test error');
            const mockHandler = jest.fn().mockRejectedValue(mockError);
            const mockReq = {};
            const mockRes = {
                headersSent: false,
                status: jest.fn(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            const wrappedHandler = withStandardResponse(mockHandler);
            await wrappedHandler(mockReq, mockRes, mockNext);

            expect(mockHandler).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(mockError);
            expect(mockRes.status).not.toHaveBeenCalled();
            expect(mockRes.json).not.toHaveBeenCalled();
        });
    });

    describe('errorHandler', () => {
        it('devrait envoyer une réponse d\'erreur standardisée', () => {
            const mockError = new Error('Test error');
            mockError.status = 400;
            mockError.errors = [{ field: 'name', message: 'Le nom est requis' }];

            const mockReq = {};
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            // Mock console.error
            const originalConsoleError = console.error;
            console.error = jest.fn();

            errorHandler(mockError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                status: 400,
                message: 'Test error',
                errors: [{ field: 'name', message: 'Le nom est requis' }]
            });

            // Restore console.error
            console.error = originalConsoleError;
        });

        it('devrait utiliser le statut 500 et un message par défaut si non fournis', () => {
            const mockError = {};
            const mockReq = {};
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const mockNext = jest.fn();

            // Mock console.error
            const originalConsoleError = console.error;
            console.error = jest.fn();

            errorHandler(mockError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                status: 500,
                message: 'Erreur interne du serveur',
                errors: null
            });

            // Restore console.error
            console.error = originalConsoleError;
        });
    });
});
