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
     * Obtenir la liste des followers d'un utilisateur
     */
    async getFollowers(targetUserID) {
        return await Follows.findAll({ where: { targetUserID } });
    }

    /**
     * Obtenir la liste des utilisateurs suivis par un utilisateur
     */
    async getFollowedUsers(fromUserID) {
        return await Follows.findAll({ where: { fromUserID } });
    }
}

module.exports = new FollowsRepository();
