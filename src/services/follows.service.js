const FollowsRepository = require("../repository/follows.repository");
const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");
const ErrorCodes = require('../../constants/errorCodes');
const ProfilesService = require("./profiles.service");

class FollowsService {
    /**
     * Suivre un utilisateur
     */
    async followUser(fromUserID, targetUserID) {
        console.log("fromUserID: ", fromUserID, "targetUserID: ", targetUserID);

        if (fromUserID === targetUserID) {
            throw { message: ErrorCodes.Follows.SelfFollowNotAllowed };
        }

        // Vérifier si l'utilisateur cible existe
        const targetUser = await UsersRepository.getUserById(targetUserID);
        if (!targetUser) {
            throw { message: ErrorCodes.User.NotFound };
        }

        // Vérifier si l'utilisateur suit déjà cette personne
        const alreadyFollowing = await FollowsRepository.isFollowing(fromUserID, targetUserID);
        if (alreadyFollowing) {
            throw { message: ErrorCodes.Follows.AlreadyFollowing };
        }

        // Ajouter le lien de follow
        try {
            await FollowsRepository.followUser(fromUserID, targetUserID);
        } catch (error) {
            throw { message: ErrorCodes.Follows.FollowFailed };
        }

        return { success: true };
    }

    /**
     * Se désabonner d'un utilisateur
     */
    async unfollowUser(fromUserID, targetUserID) {
        const follow = await FollowsRepository.isFollowing(fromUserID, targetUserID);

        if (!follow) {
            throw { message: ErrorCodes.Follows.NotFollowing };
        }

        // Supprimer la relation de follow
        try {
            await FollowsRepository.unfollowUser(fromUserID, targetUserID);
        } catch (error) {
            throw { message: ErrorCodes.Follows.UnfollowFailed };
        }

        return { success: true };
    }

    /**
     * Récupérer les followers d'un utilisateur
     */
    async getFollowers(targetUserID, page = 1, limit = 10) {
        try {
            const { total, followers } = await FollowsRepository.getFollowers(targetUserID, page, limit);
            const followersData = await Promise.all(
                followers.map(follow => ProfilesService.getProfileByUserID(follow.fromUserID))
            );
            return { page, limit, total, data: followersData };
        } catch (error) {
            throw { message: ErrorCodes.Follows.FetchFailed };
        }
    }

    /**
     * Récupérer les utilisateurs suivis par un utilisateur
     */
    async getFollowedUsers(fromUserID, page = 1, limit = 10) {
        try {
            const { total, followedUsers } = await FollowsRepository.getFollowedUsers(fromUserID, page, limit);
            const followedUsersData = await Promise.all(
                followedUsers.map(follow => ProfilesService.getProfileByUserID(follow.targetUserID))
            );

            return { page, limit, total, data: followedUsersData };
        } catch (error) {
            throw { message: ErrorCodes.Follows.FetchFailed };
        }
    }
}

module.exports = new FollowsService();