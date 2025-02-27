const FollowsRepository = require("../repository/follows.repository");
const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");

class FollowsService {
    /**
     * Suivre un utilisateur
     */
    async followUser(fromUserID, targetUserID) {
        console.log("fromUserID: ", fromUserID, "targetUserID: ", targetUserID);
        if (fromUserID === targetUserID) {
            const error = new Error("Vous ne pouvez pas vous suivre vous-même.");
            error.status = 400;
            throw error;
        }

        // Vérifier si l'utilisateur cible existe
        const targetUser = await UsersRepository.getUserById(targetUserID);
        if (!targetUser) {
            const error = new Error("Utilisateur cible non trouvé.");
            error.status = 404;
            throw error;
        }

        // Vérifier si l'utilisateur suit déjà cette personne
        const alreadyFollowing = await FollowsRepository.isFollowing(fromUserID, targetUserID);
        if (alreadyFollowing) {
            const error = new Error("Vous suivez déjà cet utilisateur.");
            error.status = 400;
            throw error;
        }

        // Ajouter le lien de follow
        await FollowsRepository.followUser(fromUserID, targetUserID);

        return { message: "Utilisateur suivi avec succès." };
    }

    /**
     * Se désabonner d'un utilisateur
     */
    async unfollowUser(fromUserID, targetUserID) {
        const follow = await FollowsRepository.isFollowing(fromUserID, targetUserID);

        if (!follow) {
            const error = new Error("Vous ne suivez pas cet utilisateur.");
            error.status = 400;
            throw error;
        }

        // Supprimer la relation de follow
        await FollowsRepository.unfollowUser(fromUserID, targetUserID);

        return { message: "Utilisateur désabonné avec succès." };
    }

    /**
     * Récupérer les followers d'un utilisateur
     */
    async getFollowers(targetUserID, page = 1, limit = 10) {
        const { total, followers } = await FollowsRepository.getFollowers(targetUserID, page, limit);
        const followersData = await Promise.all(
            followers.map(follow => ProfilesRepository.getProfileByUserID(follow.fromUserID))
        );
        return { page, limit, total, data: followersData };
    }


    /**
     * Récupérer les utilisateurs suivis par un utilisateur
     */
    async getFollowedUsers(fromUserID, page = 1, limit = 10) {
        const { total, followedUsers } = await FollowsRepository.getFollowedUsers(fromUserID, page, limit);

        const followedUsersData = await Promise.all(
            followedUsers.map(follow => ProfilesRepository.findByUserID(follow.targetUserID))
        );

        return { page, limit, total, data: followedUsersData };
    }


}

module.exports = new FollowsService();
