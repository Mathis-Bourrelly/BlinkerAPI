const CommentsRepository = require('../repository/comments.repository');
const blinksRepository = require('../repository/blinks.repository');
const { sequelize } = require('../core/postgres');
const ErrorCodes = require('../../constants/errorCodes');
const { createError, withTransaction } = require('../utils/error.utils');

// Import du service utilisateur pour la mise à jour des scores
const UsersService = require('./users.service');

class CommentsService {
    constructor() {
        this.commentsRepository = new CommentsRepository();
        this.blinksRepository = blinksRepository;
    }

    /**
     * Crée un nouveau commentaire
     * @param {string} blinkID - ID du blink
     * @param {string} userID - ID de l'utilisateur
     * @param {string} content - Contenu du commentaire
     * @returns {Promise<Object>} Le commentaire créé avec les infos utilisateur
     */
    async createComment(blinkID, userID, content) {
        return await withTransaction(async (transaction) => {
            // Vérifier que le blink existe
            const blink = await this.blinksRepository.getBlinkById(blinkID);
            if (!blink) {
                throw createError(ErrorCodes.Blinks.NotFound);
            }

            // Vérifier que l'utilisateur n'a pas déjà commenté ce blink
            const hasCommented = await this.commentsRepository.hasUserCommented(blinkID, userID);
            if (hasCommented) {
                throw createError(ErrorCodes.Comments.AlreadyCommented);
            }

            // Créer le commentaire
            const comment = await this.commentsRepository.createComment({
                blinkID,
                userID,
                content
            }, { transaction });

            // Incrémenter le compteur de commentaires du blink
            await this.incrementBlinkCommentCount(blinkID, transaction);

            // Mettre à jour le score de l'utilisateur qui a commenté
            try {
                await UsersService.updateUserScore(userID);
            } catch (error) {
                console.warn(`Impossible de mettre à jour le score de l'utilisateur ${userID}:`, error.message);
            }

            // Récupérer le commentaire avec les informations utilisateur
            return await this.commentsRepository.getCommentById(comment.commentID);
        }, sequelize, ErrorCodes.Comments.CreationFailed);
    }

    /**
     * Récupère les commentaires d'un blink avec pagination
     * @param {string} blinkID - ID du blink
     * @param {number} page - Numéro de page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<Object>} Résultats paginés
     */
    async getCommentsByBlinkId(blinkID, page = 1, limit = 10) {
        // Vérifier que le blink existe
        const blink = await this.blinksRepository.getBlinkById(blinkID);
        if (!blink) {
            throw createError(ErrorCodes.Blinks.NotFound);
        }

        return await this.commentsRepository.getCommentsByBlinkId(blinkID, page, limit);
    }

    /**
     * Met à jour un commentaire
     * @param {string} commentID - ID du commentaire
     * @param {string} userID - ID de l'utilisateur (pour vérifier les permissions)
     * @param {string} content - Nouveau contenu
     * @returns {Promise<Object>} Le commentaire mis à jour
     */
    async updateComment(commentID, userID, content) {
        return await withTransaction(async (transaction) => {
            // Récupérer le commentaire existant
            const comment = await this.commentsRepository.getCommentById(commentID);
            if (!comment) {
                throw createError(ErrorCodes.Comments.NotFound);
            }

            // Vérifier que l'utilisateur est bien l'auteur du commentaire
            if (comment.userID !== userID) {
                throw createError(ErrorCodes.Comments.Unauthorized);
            }

            // Mettre à jour le commentaire
            await this.commentsRepository.updateComment(commentID, { content }, { transaction });

            // Récupérer le commentaire mis à jour avec les informations utilisateur
            return await this.commentsRepository.getCommentById(commentID);
        }, sequelize, ErrorCodes.Comments.UpdateFailed);
    }

    /**
     * Supprime un commentaire
     * @param {string} commentID - ID du commentaire
     * @param {string} userID - ID de l'utilisateur (pour vérifier les permissions)
     * @returns {Promise<boolean>} true si supprimé avec succès
     */
    async deleteComment(commentID, userID) {
        return await withTransaction(async (transaction) => {
            // Récupérer le commentaire existant
            const comment = await this.commentsRepository.getCommentById(commentID);
            if (!comment) {
                throw createError(ErrorCodes.Comments.NotFound);
            }

            // Vérifier que l'utilisateur est bien l'auteur du commentaire
            if (comment.userID !== userID) {
                throw createError(ErrorCodes.Comments.Unauthorized);
            }

            // Supprimer le commentaire
            await this.commentsRepository.deleteComment(commentID, { transaction });

            // Décrémenter le compteur de commentaires du blink
            await this.decrementBlinkCommentCount(comment.blinkID, transaction);

            // Mettre à jour le score de l'utilisateur
            try {
                await UsersService.updateUserScore(userID);
            } catch (error) {
                console.warn(`Impossible de mettre à jour le score de l'utilisateur ${userID}:`, error.message);
            }

            return true;
        }, sequelize, ErrorCodes.Comments.DeletionFailed);
    }

    /**
     * Récupère un commentaire par son ID
     * @param {string} commentID - ID du commentaire
     * @returns {Promise<Object|null>} Le commentaire avec les infos utilisateur
     */
    async getCommentById(commentID) {
        const comment = await this.commentsRepository.getCommentById(commentID);
        if (!comment) {
            throw createError(ErrorCodes.Comments.NotFound);
        }
        return comment;
    }

    /**
     * Vérifie si un utilisateur a commenté un blink
     * @param {string} blinkID - ID du blink
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Object|null>} Le commentaire ou null
     */
    async getUserCommentForBlink(blinkID, userID) {
        return await this.commentsRepository.getUserCommentForBlink(blinkID, userID);
    }

    /**
     * Récupère les commentaires d'un utilisateur
     * @param {string} userID - ID de l'utilisateur
     * @param {number} page - Numéro de page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<Object>} Résultats paginés
     */
    async getCommentsByUserId(userID, page = 1, limit = 10) {
        return await this.commentsRepository.getCommentsByUserId(userID, page, limit);
    }

    /**
     * Incrémente le compteur de commentaires d'un blink
     * @param {string} blinkID - ID du blink
     * @param {Object} transaction - Transaction Sequelize
     * @private
     */
    async incrementBlinkCommentCount(blinkID, transaction) {
        await sequelize.query(`
            UPDATE "Blinks" 
            SET "commentCount" = "commentCount" + 1 
            WHERE "blinkID" = :blinkID
        `, {
            replacements: { blinkID },
            transaction
        });
    }

    /**
     * Décrémente le compteur de commentaires d'un blink
     * @param {string} blinkID - ID du blink
     * @param {Object} transaction - Transaction Sequelize
     * @private
     */
    async decrementBlinkCommentCount(blinkID, transaction) {
        await sequelize.query(`
            UPDATE "Blinks" 
            SET "commentCount" = GREATEST("commentCount" - 1, 0) 
            WHERE "blinkID" = :blinkID
        `, {
            replacements: { blinkID },
            transaction
        });
    }
}

module.exports = CommentsService;
