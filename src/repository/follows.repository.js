const Follows = require('../models/follows');

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
        return await Follows.create({ fromUserID, targetUserID });
    }

    /**
     * Supprimer un lien de suivi entre deux utilisateurs
     */
    async unfollowUser(fromUserID, targetUserID) {
        return await Follows.destroy({ where: { fromUserID, targetUserID } });
    }


    /**
     * Obtenir la liste des followers d'un utilisateur avec pagination
     */
    async getFollowers(targetUserID, page, limit) {
        const offset = (page - 1) * limit;
        const { count, rows } = await Follows.findAndCountAll({
            where: { targetUserID },
            limit,
            offset
        });

        return { total: count, followers: rows };
    }

    /**
     * Obtenir la liste des utilisateurs suivis par un utilisateur avec pagination
     */
    async getFollowedUsers(fromUserID, page, limit) {
        const offset = (page - 1) * limit;
        const { count, rows } = await Follows.findAndCountAll({
            where: { fromUserID },
            limit,
            offset
        });

        return { total: count, followedUsers: rows };
    }


}

module.exports = new FollowsRepository();
