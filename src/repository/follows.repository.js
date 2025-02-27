const Follows = require('../models/follows');
const ErrorCodes = require('../../constants/errorCodes');

class FollowsRepository {
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
            throw { code: ErrorCodes.Follows.AlreadyFollowing };
        }

        try {
            return await Follows.create({ fromUserID, targetUserID });
        } catch (error) {
            throw { code: ErrorCodes.Follows.FollowFailed };
        }
    }

    /**
     * Supprimer un lien de suivi entre deux utilisateurs
     */
    async unfollowUser(fromUserID, targetUserID) {
        const existingFollow = await this.isFollowing(fromUserID, targetUserID);
        if (!existingFollow) {
            throw { code: ErrorCodes.Follows.NotFollowing };
        }

        try {
            return await Follows.destroy({ where: { fromUserID, targetUserID } });
        } catch (error) {
            throw { code: ErrorCodes.Follows.UnfollowFailed };
        }
    }

    /**
     * Obtenir la liste des followers d'un utilisateur avec pagination
     */
    async getFollowers(targetUserID, page, limit) {
        try {
            const offset = (page - 1) * limit;
            const { count, rows } = await Follows.findAndCountAll({
                where: { targetUserID },
                limit,
                offset
            });

            return { total: count, followers: rows };
        } catch (error) {
            throw { code: ErrorCodes.Follows.FetchFailed };
        }
    }

    /**
     * Obtenir la liste des utilisateurs suivis par un utilisateur avec pagination
     */
    async getFollowedUsers(fromUserID, page, limit) {
        try {
            const offset = (page - 1) * limit;
            const { count, rows } = await Follows.findAndCountAll({
                where: { fromUserID },
                limit,
                offset
            });

            return { total: count, followedUsers: rows };
        } catch (error) {
            throw { code: ErrorCodes.Follows.FetchFailed };
        }
    }
}

module.exports = new FollowsRepository();