const Profiles = require("../models/Profiles");

class ProfilesRepository {
    /**
     * Trouve un profil par userID.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object|null>} Le profil ou null si inexistant.
     */
    async findByUserID(userID) {
        return await Profiles.findOne({ where: { userID } });
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
     * Crée un nouveau profil.
     * @param {Object} profileData - Données du profil.
     * @returns {Promise<Object>} Le profil créé.
     */
    async create(profileData) {
        return await Profiles.create(profileData);
    }
}

module.exports = new ProfilesRepository();