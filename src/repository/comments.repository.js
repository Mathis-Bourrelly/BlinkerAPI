const Comments = require('../models/comments');
const Users = require('../models/users');
const Profiles = require('../models/profiles');
const Blinks = require('../models/blinks');
const { Op } = require('sequelize');
const ErrorCodes = require('../../constants/errorCodes');
const BaseRepository = require('./base.repository');
const { normalizePaginationParams, formatPaginatedResponse } = require('../utils/pagination.utils');
const { createError } = require('../utils/error.utils');

class CommentsRepository extends BaseRepository {
    constructor() {
        super(Comments, ErrorCodes.Comments);
    }

    /**
     * Crée un nouveau commentaire
     * @param {Object} commentData - Données du commentaire
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} Le commentaire créé
     */
    async createComment(commentData, options = {}) {
        try {
            return await this.create(commentData, options);
        } catch (error) {
            // Gérer l'erreur de contrainte d'unicité
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw createError(ErrorCodes.Comments.AlreadyCommented);
            }
            throw error;
        }
    }

    /**
     * Récupère un commentaire par son ID avec les informations utilisateur
     * @param {string} commentID - ID du commentaire
     * @returns {Promise<Object|null>} Le commentaire avec les infos utilisateur
     */
    async getCommentById(commentID) {
        return await Comments.findByPk(commentID, {
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['userID'],
                    include: [{
                        model: Profiles,
                        attributes: ['display_name', 'username', 'avatar_url']
                    }]
                }
            ]
        });
    }

    /**
     * Récupère les commentaires d'un blink avec pagination
     * @param {string} blinkID - ID du blink
     * @param {number} page - Numéro de page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<Object>} Résultats paginés
     */
    async getCommentsByBlinkId(blinkID, page = 1, limit = 10) {
        const { offset } = normalizePaginationParams({ page, limit });

        const { count, rows } = await Comments.findAndCountAll({
            where: { blinkID },
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['userID'],
                    include: [{
                        model: Profiles,
                        attributes: ['display_name', 'username', 'avatar_url']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return formatPaginatedResponse({
            page,
            limit,
            total: count,
            data: rows
        });
    }

    /**
     * Vérifie si un utilisateur a déjà commenté un blink
     * @param {string} blinkID - ID du blink
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<boolean>} true si l'utilisateur a déjà commenté
     */
    async hasUserCommented(blinkID, userID) {
        const comment = await Comments.findOne({
            where: { blinkID, userID }
        });
        return !!comment;
    }

    /**
     * Récupère le commentaire d'un utilisateur pour un blink spécifique
     * @param {string} blinkID - ID du blink
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Object|null>} Le commentaire ou null
     */
    async getUserCommentForBlink(blinkID, userID) {
        return await Comments.findOne({
            where: { blinkID, userID },
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['userID'],
                    include: [{
                        model: Profiles,
                        attributes: ['display_name', 'username', 'avatar_url']
                    }]
                }
            ]
        });
    }

    /**
     * Met à jour un commentaire
     * @param {string} commentID - ID du commentaire
     * @param {Object} updateData - Données à mettre à jour
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<Object>} Le commentaire mis à jour
     */
    async updateComment(commentID, updateData, options = {}) {
        return await this.update(commentID, updateData, options);
    }

    /**
     * Supprime un commentaire
     * @param {string} commentID - ID du commentaire
     * @param {Object} options - Options Sequelize (ex: transaction)
     * @returns {Promise<boolean>} true si supprimé avec succès
     */
    async deleteComment(commentID, options = {}) {
        return await this.delete(commentID, options);
    }

    /**
     * Compte le nombre de commentaires pour un blink
     * @param {string} blinkID - ID du blink
     * @returns {Promise<number>} Nombre de commentaires
     */
    async countCommentsByBlinkId(blinkID) {
        return await Comments.count({
            where: { blinkID }
        });
    }

    /**
     * Récupère tous les commentaires d'un utilisateur
     * @param {string} userID - ID de l'utilisateur
     * @param {number} page - Numéro de page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<Object>} Résultats paginés
     */
    async getCommentsByUserId(userID, page = 1, limit = 10) {
        const { offset } = normalizePaginationParams({ page, limit });

        const { count, rows } = await Comments.findAndCountAll({
            where: { userID },
            include: [
                {
                    model: Blinks,
                    as: 'blink',
                    attributes: ['blinkID', 'createdAt']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        return formatPaginatedResponse({
            page,
            limit,
            total: count,
            data: rows
        });
    }
}

module.exports = CommentsRepository;
