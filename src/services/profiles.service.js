const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");

class ProfilesService {
    /**
     * Crée un profil pour un utilisateur existant.
     * @param {Object} data - Données du profil.
     * @param {string} data.userID - UUID de l'utilisateur.
     * @param {string} data.display_name - Nom d'utilisateur affiché.
     * @param {string} data.username - Nom d'utilisateur unique.
     * @param {string} [data.bio] - Bio de l'utilisateur.
     * @param {string} [data.avatar_url] - URL de l'avatar.
     * @returns {Promise<Object>} Le profil créé.
     * @throws {Error} Si l'utilisateur n'existe pas, si le username est pris ou si une erreur interne survient.
     */
    async createProfile({ userID, username, display_name, bio, avatar_url }) {
        // Vérifie si l'utilisateur existe
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw this._createError(404, "Utilisateur non trouvé.");
        }

        const existingProfile = await ProfilesRepository.findByUsername(username);
        if (existingProfile) {
            throw this._createError(409, "Ce nom d'utilisateur est déjà pris.");
        }

        return await ProfilesRepository.create({
            userID,
            display_name,
            username,
            bio: bio || null,
            avatar_url: avatar_url || null,
            score: 0
        });
    }

    /**
     * Récupère un profil par userID.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object>} Le profil trouvé.
     * @throws {Error} Si le profil n'existe pas.
     */
    async getProfileByUserID(userID) {
        const profile = await ProfilesRepository.findByUserID(userID);
        if (!profile) {
            throw this._createError(404, "Profil non trouvé.");
        }
        return profile;
    }

    /**
     * Crée une erreur avec un statut HTTP personnalisé.
     * @param {number} statusCode - Code HTTP de l'erreur.
     * @param {string} message - Message d'erreur.
     * @returns {Error} L'erreur formatée.
     */
    _createError(statusCode, message) {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }
}

module.exports = new ProfilesService();