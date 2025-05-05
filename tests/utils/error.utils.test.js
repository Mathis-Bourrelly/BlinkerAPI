/**
 * Tests unitaires pour les utilitaires de gestion d'erreurs
 */
const { createError, withTransaction } = require('../../src/utils/error.utils');
const ErrorCodes = require('../../constants/errorCodes');

describe('Error Utilities', () => {
    describe('createError', () => {
        it('devrait créer un objet d\'erreur avec le message fourni', () => {
            const error = createError('Test error message');
            expect(error).toEqual({ message: 'Test error message' });
        });

        it('devrait utiliser ErrorCodes.Base.UnknownError si aucun message n\'est fourni', () => {
            const error = createError(null);
            expect(error).toEqual({ message: ErrorCodes.Base.UnknownError });
        });

        it('devrait logger l\'erreur originale si fournie', () => {
            // Mock console.error
            const originalConsoleError = console.error;
            console.error = jest.fn();

            const originalError = new Error('Original error');
            createError('Test error message', originalError);

            expect(console.error).toHaveBeenCalledWith('Erreur originale:', originalError);

            // Restore console.error
            console.error = originalConsoleError;
        });
    });

    describe('withTransaction', () => {
        it('devrait exécuter l\'opération et commiter la transaction en cas de succès', async () => {
            const mockTransaction = {
                commit: jest.fn().mockResolvedValue(undefined),
                rollback: jest.fn().mockResolvedValue(undefined)
            };

            const mockSequelize = {
                transaction: jest.fn().mockResolvedValue(mockTransaction)
            };

            const mockOperation = jest.fn().mockResolvedValue('result');

            const result = await withTransaction(mockOperation, mockSequelize);

            expect(mockSequelize.transaction).toHaveBeenCalled();
            expect(mockOperation).toHaveBeenCalledWith(mockTransaction);
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(mockTransaction.rollback).not.toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('devrait rollback la transaction et lancer une erreur en cas d\'échec', async () => {
            const mockTransaction = {
                commit: jest.fn().mockResolvedValue(undefined),
                rollback: jest.fn().mockResolvedValue(undefined)
            };

            const mockSequelize = {
                transaction: jest.fn().mockResolvedValue(mockTransaction)
            };

            const mockError = new Error('Operation failed');
            const mockOperation = jest.fn().mockRejectedValue(mockError);

            await expect(withTransaction(mockOperation, mockSequelize, 'Custom error code')).rejects.toEqual({
                message: mockError.message
            });

            expect(mockSequelize.transaction).toHaveBeenCalled();
            expect(mockOperation).toHaveBeenCalledWith(mockTransaction);
            expect(mockTransaction.commit).not.toHaveBeenCalled();
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });

        it('devrait utiliser le code d\'erreur personnalisé si l\'erreur n\'a pas de message', async () => {
            const mockTransaction = {
                commit: jest.fn().mockResolvedValue(undefined),
                rollback: jest.fn().mockResolvedValue(undefined)
            };

            const mockSequelize = {
                transaction: jest.fn().mockResolvedValue(mockTransaction)
            };

            const mockError = new Error();
            mockError.message = undefined;
            const mockOperation = jest.fn().mockRejectedValue(mockError);

            await expect(withTransaction(mockOperation, mockSequelize, 'Custom error code')).rejects.toEqual({
                message: 'Custom error code'
            });

            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });
});
