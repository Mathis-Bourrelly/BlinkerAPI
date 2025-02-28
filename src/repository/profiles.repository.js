const { sequelize } = require('../core/postgres');
const Profiles = require("../models/Profiles");
const ErrorCodes = require("../../constants/errorCodes");

class ProfilesRepository {
    /**
     * Trouve un profil par userID avec les stats de follows et blinks.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object|null>} Le profil enrichi ou null si inexistant.
     */
    async findByUserID(userID) {
        const profile = await Profiles.findOne({
            where: { userID },
            attributes: [
                'userID',
                'username',
                'display_name',
                'bio',
                'avatar_url',
                'score',
                [sequelize.literal(`(
                SELECT COUNT(*) FROM "Follows" WHERE "Follows"."fromUserID" = "Profiles"."userID"
            )`), 'followingCount'],
                [sequelize.literal(`(
                SELECT COUNT(*) FROM "Follows" WHERE "Follows"."targetUserID" = "Profiles"."userID"
            )`), 'followersCount'],
                [sequelize.literal(`(
                SELECT COUNT(*) FROM "Blinks" WHERE "Blinks"."userID" = "Profiles"."userID"
            )`), 'blinksCount']
            ]
        });

        if (!profile) {
            throw { code: ErrorCodes.Profiles.NotFound };
        }

        return profile;
    }

    /**
     * Trouve un profil par username.
     * @param {string} username - Nom d'utilisateur.
     * @returns {Promise<Object|null>} Le profil ou null si inexistant.
     */
    async findByUsername(username) {
        const profile = await Profiles.findOne({ where: { username } });

        if (!profile) {
            throw { code: ErrorCodes.Profiles.NotFound };
        }

        return profile;
    }

    /**
     * Récupère un profil basique par userID.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object|null>} Le profil complet ou null s'il n'existe pas.
     */
    async getProfileByUserID(userID) {
        const profile = await Profiles.findOne({
            where: { userID },
            attributes: [
                'userID',
                'username',
                'display_name',
                'bio',
                'avatar_url',
                'score'
            ]
        });

        if (!profile) {
            throw { code: ErrorCodes.Profiles.NotFound };
        }

        return profile;
    }

    /**
     * Crée un nouveau profil.
     * @param {Object} profileData - Données du profil.
     * @returns {Promise<Object>} Le profil créé.
     */
    async create(profileData) {
        try {
            return await Profiles.create(profileData);
        } catch (error) {
            throw { code: ErrorCodes.Profiles.CreationFailed };
        }
    }
}

module.exports = new ProfilesRepository();
