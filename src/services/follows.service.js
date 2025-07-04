const FollowsRepository = require("../repository/follows.repository");
const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");
const ErrorCodes = require('../../constants/errorCodes');
const ProfilesService = require("./profiles.service");

class FollowsService {
    /**
     * Vérifie si un utilisateur suit un autre utilisateur
     * @param {string} fromUserID - ID de l'utilisateur qui suit
     * @param {string} targetUserID - ID de l'utilisateur suivi
     * @returns {Promise<boolean>} - true si l'utilisateur suit la cible, false sinon
     */
    async isFollowing(fromUserID, targetUserID) {
        try {
            const follow = await FollowsRepository.isFollowing(fromUserID, targetUserID);
            return !!follow; // Convertit en booléen
        } catch (error) {
            console.error(`Erreur lors de la vérification du follow entre ${fromUserID} et ${targetUserID}:`, error);
            return false;
        }
    }

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
            const result = await FollowsRepository.getFollowers(targetUserID, page, limit);
            const { total, data: follows } = result;

            // Récupérer les profils des followers, en ignorant ceux qui n'existent pas
            const followersData = [];
            for (const follow of follows) {
                try {
                    const profile = await ProfilesService.getProfileByUserID(follow.fromUserID);
                    followersData.push(profile);
                } catch (profileError) {
                    console.warn(`Profil non trouvé pour l'utilisateur ${follow.fromUserID}:`, profileError.message);
                    // Continuer avec le prochain profil
                }
            }

            return { page, limit, total, data: followersData };
        } catch (error) {
            console.error('Erreur lors de la récupération des followers:', error);
            throw { message: ErrorCodes.Follows.FetchFailed };
        }
    }

    /**
     * Récupérer les utilisateurs suivis par un utilisateur
     */
    async getFollowedUsers(fromUserID, page = 1, limit = 10) {
        try {
            const result = await FollowsRepository.getFollowedUsers(fromUserID, page, limit);
            const { total, data: follows } = result;

            // Récupérer les profils des utilisateurs suivis, en ignorant ceux qui n'existent pas
            const followedUsersData = [];
            for (const follow of follows) {
                try {
                    const profile = await ProfilesService.getProfileByUserID(follow.targetUserID);
                    followedUsersData.push(profile);
                } catch (profileError) {
                    console.warn(`Profil non trouvé pour l'utilisateur ${follow.targetUserID}:`, profileError.message);
                    // Continuer avec le prochain profil
                }
            }

            return { page, limit, total, data: followedUsersData };
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs suivis:', error);
            throw { message: ErrorCodes.Follows.FetchFailed };
        }
    }
}

module.exports = new FollowsService();