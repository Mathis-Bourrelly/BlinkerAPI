const Follows = require('../models/follows');
const ErrorCodes = require('../../constants/errorCodes');
const BaseRepository = require('./base.repository');
const { Op } = require('sequelize');
const { normalizePaginationParams, formatPaginatedResponse } = require('../utils/pagination.utils');
const { createError } = require('../utils/error.utils');

class FollowsRepository extends BaseRepository {
    constructor() {
        super(Follows, ErrorCodes.Follows);
    }
    /**
     * Vérifie si un utilisateur suit déjà un autre utilisateur
     */
    async isFollowing(fromUserID, targetUserID) {
        return await Follows.findOne({ where: { fromUserID, targetUserID } });
    }

    /**
     * Ajouter un lien de suivi entre deux utilisateurs
     */
    async followUser(fromUserID, targetUserID) {
        const existingFollow = await this.isFollowing(fromUserID, targetUserID);
        if (existingFollow) {
            throw { message: ErrorCodes.Follows.AlreadyFollowing };
        }

        return this.create({ fromUserID, targetUserID });
    }

    /**
     * Supprimer un lien de suivi entre deux utilisateurs
     */
    async unfollowUser(fromUserID, targetUserID) {
        const existingFollow = await this.isFollowing(fromUserID, targetUserID);
        if (!existingFollow) {
            throw { message: ErrorCodes.Follows.NotFollowing };
        }

        try {
            return await Follows.destroy({ where: { fromUserID, targetUserID } });
        } catch (error) {
            throw { message: ErrorCodes.Follows.UnfollowFailed };
        }
    }

    /**
     * Obtenir la liste des followers d'un utilisateur avec pagination
     * @param {string} targetUserID - ID de l'utilisateur cible
     * @param {number} page - Numéro de la page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<Object>} Résultat paginé
     */
    async getFollowers(targetUserID, page, limit) {
        try {
            const { offset, limit: normalizedLimit } = normalizePaginationParams({ page, limit });
            const { count, rows } = await Follows.findAndCountAll({
                where: { targetUserID },
                limit: normalizedLimit,
                offset
            });

            return formatPaginatedResponse({
                page,
                limit: normalizedLimit,
                total: count,
                data: rows
            });
        } catch (error) {
            throw createError(ErrorCodes.Follows.FetchFailed, error);
        }
    }

    /**
     * Obtenir la liste des utilisateurs suivis par un utilisateur avec pagination
     * @param {string} fromUserID - ID de l'utilisateur qui suit
     * @param {number} page - Numéro de la page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<Object>} Résultat paginé
     */
    async getFollowedUsers(fromUserID, page, limit) {
        try {
            const { offset, limit: normalizedLimit } = normalizePaginationParams({ page, limit });
            const { count, rows } = await Follows.findAndCountAll({
                where: { fromUserID },
                limit: normalizedLimit,
                offset
            });

            return formatPaginatedResponse({
                page,
                limit: normalizedLimit,
                total: count,
                data: rows
            });
        } catch (error) {
            throw createError(ErrorCodes.Follows.FetchFailed, error);
        }
    }
}

module.exports = new FollowsRepository();