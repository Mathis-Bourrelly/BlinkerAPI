const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");
const ErrorCodes = require("../../constants/errorCodes");

class ProfilesService {
    /**
     * Crée un profil pour un utilisateur existant.
     * @param {string} userID - UUID de l'utilisateur.
     * @param {string} display_name - Nom d'utilisateur affiché.
     * @param {string} username - Nom d'utilisateur unique.
     * @param {string} [bio] - Bio de l'utilisateur.
     * @param {string} [avatar_url] - URL de l'avatar.
     * @returns {Promise<Object>} Le profil créé.
     * @throws {Error} Si l'utilisateur n'existe pas, si le username est pris ou si une erreur interne survient.
     */
    async createProfile(userID, username, display_name, bio, avatar_url) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw { code: ErrorCodes.User.NotFound };
        }

        const existingProfile = await ProfilesRepository.findByUsername(username);
        if (existingProfile) {
            throw { code: ErrorCodes.Profiles.UsernameTaken };
        }

        try {
            return await ProfilesRepository.create({
                userID,
                display_name,
                username,
                bio: bio || null,
                avatar_url: avatar_url || null,
                score: 0
            });
        } catch (error) {
            throw { code: ErrorCodes.Profiles.CreationFailed };
        }
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
            throw { code: ErrorCodes.Profiles.NotFound };
        }
        return profile;
    }
}

module.exports = new ProfilesService();