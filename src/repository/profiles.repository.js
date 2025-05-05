const { sequelize } = require('../core/postgres');
const Profiles = require("../models/profiles");
const ErrorCodes = require("../../constants/errorCodes");
const BaseRepository = require('./base.repository');

class ProfilesRepository extends BaseRepository {
    constructor() {
        super(Profiles, ErrorCodes.Profiles);
    }
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
            throw { message: ErrorCodes.Profiles.NotFound };
        }

        return profile;
    }

    /**
     * Trouve un profil par username.
     * @param {string} username - Nom d'utilisateur.
     * @returns {Promise<Object|null>} Le profil ou null si inexistant.
     */
    async findByUsername(username) {
        return await Profiles.findOne({where: {username}});
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
            throw { message: ErrorCodes.Profiles.NotFound };
        }

        return profile;
    }

    // La méthode create est héritée de BaseRepository

    /**
     * Met à jour l'URL de l'avatar pour un utilisateur donné.
     * @param {string} userID - UUID de l'utilisateur.
     * @param {string} avatar_url - URL de l'avatar.
     * @returns {Promise<void>}
     */
     async updateAvatar(userID, avatar_url) {
        return this.update(userID, { avatar_url });
    }

    /**
     * Met à jour le score d'un utilisateur
     * @param {string} userID - UUID de l'utilisateur
     * @param {number} score - Nouveau score
     * @returns {Promise<void>}
     */
    async updateScore(userID, score) {
        return this.update(userID, { score });
    }
}

module.exports = new ProfilesRepository();
