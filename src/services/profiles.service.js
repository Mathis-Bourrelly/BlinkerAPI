const multer = require('multer');
const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");
const BlinkService = require("./blinks.service"); // Import du service des Blinks
const ErrorCodes = require("../../constants/errorCodes");

class ProfilesService {


    /**
     * Crée un profil pour un utilisateur existant.
     * @param {string} userID - UUID de l'utilisateur.
     * @param {string} display_name - Nom d'utilisateur affiché.
     * @param {string} username - Nom d'utilisateur unique.
     * @param {string} [bio] - Bio de l'utilisateur.
     * @param file - profile picture file.
     * @returns {Promise<Object>} Le profil créé.
     * @throws {Error} Si l'utilisateur n'existe pas, si le username est pris ou si une erreur interne survient.
     */
    async createProfile(userID, username, display_name, bio, file) {
        console.log("Creating new profile", userID, username, display_name, bio, file);
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }
        let existingProfile

        existingProfile = await ProfilesRepository.findByUsername(username);

        if (existingProfile) {
            throw {message: ErrorCodes.Profiles.UsernameTaken};

        }

        try {
            return await ProfilesRepository.create({
                userID,
                display_name,
                username,
                bio: bio || null,
                avatar_url: file.filename || null
            });
        } catch (error) {
            console.log(error);
            throw {message: ErrorCodes.Profiles.CreationFailed};
        }
    }

    /**
     * Récupère un profil par userID, en ajoutant le score calculé.
     * @param {string} userID - UUID de l'utilisateur.
     * @returns {Promise<Object>} Le profil trouvé avec le score mis à jour.
     * @throws {Error} Si le profil n'existe pas.
     */
    async getProfileByUserID(userID) {
        const profile = await ProfilesRepository.findByUserID(userID);
        if (!profile) {
            throw {message: ErrorCodes.Profiles.NotFound};
        }

        profile.score = await BlinkService.getUserScore(userID);

        return profile;
    }

    /**
     * Met à jour l'URL de l'avatar pour un utilisateur donné.
     * @param {string} userID - UUID de l'utilisateur.
     * @param {Object} file - Objet file contenant les informations sur le fichier uploadé.
     * @returns {Promise<string>} URL de l'avatar mis à jour.
     * @throws {Error} Si le profil n'existe pas.
     */
     async updateAvatar(userID, file) {
        const profile = await ProfilesRepository.findByUserID(userID);
        if (!profile) {
            throw { message: 'Profile not found' };
        }

        const avatar_url = file.filename; // Chemin où le fichier est stocké
        await ProfilesRepository.updateAvatar(userID, avatar_url);

        return avatar_url;
    }

}

module.exports = new ProfilesService();