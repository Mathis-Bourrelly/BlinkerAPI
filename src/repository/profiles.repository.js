const { sequelize } = require('../core/postgres');
const Profiles = require("../models/Profiles");
const User = require("../models/users");

class ProfilesRepository {
    /**
     * Trouve un profil par userID avec les stats de follows et blinks.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object|null>} Le profil enrichi ou null si inexistant.
     */
    async findByUserID(userID) {
        return await Profiles.findOne({
            where: { userID },
            attributes: [
                'userID',
                'username',
                'display_name', // Utilisation du nouveau champ display_name présent dans Profiles
                'bio',
                'avatar_url',
                'score',
                [sequelize.literal(`(
                SELECT COUNT(*) FROM "Follows" WHERE "Follows"."fromUserID" = "Profiles"."userID"
            )`), 'followingCount'], // Nombre de follows
                [sequelize.literal(`(
                SELECT COUNT(*) FROM "Follows" WHERE "Follows"."targetUserID" = "Profiles"."userID"
            )`), 'followersCount'], // Nombre de followers
                [sequelize.literal(`(
                SELECT COUNT(*) FROM "Blinks" WHERE "Blinks"."userID" = "Profiles"."userID"
            )`), 'blinksCount'] // Nombre de blinks publiés
            ]
            // L'inclusion du modèle User n'est plus nécessaire puisque le champ name n'existe plus dans User.
        });
    }
    /**
     * Trouve un profil par username.
     * @param {string} username - Nom d'utilisateur.
     * @returns {Promise<Object|null>} Le profil ou null si inexistant.
     */
    async findByUsername(username) {
        return await Profiles.findOne({ where: { username } });
    }

    /**
     * Récupère un profil basique par userID.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object|null>} Le profil complet ou null s'il n'existe pas.
     */
    async getProfileByUserID(userID) {
        return await Profiles.findOne({
            where: { userID },
            attributes: [
                'userID',
                'username',
                'display_name', // Champ affichant le nom de l'utilisateur
                'bio',
                'avatar_url',
                'score'
            ]
        });
    }

    /**
     * Crée un nouveau profil.
     * @param {Object} profileData - Données du profil.
     * @returns {Promise<Object>} Le profil créé.
     */
    async create(profileData) {
        return await Profiles.create(profileData);
    }
}

module.exports = new ProfilesRepository();