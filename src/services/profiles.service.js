const multer = require('multer');
const UsersRepository = require("../repository/users.repository");
const ProfilesRepository = require("../repository/profiles.repository");
const BlinkService = require("./blinks.service"); // Import du service des Blinks
const ErrorCodes = require("../../constants/errorCodes");
const fs = require('fs');
const path = require('path');
const https = require('https');
const { buildAvatarUrl } = require("../utils/url.utils");
require('dotenv').config();

class ProfilesService {
    /**
     * Construit l'URL complète de l'avatar à partir du nom du fichier.
     * @param {string} filename - Nom du fichier de l'avatar.
     * @returns {string} URL complète de l'avatar.
     * @deprecated Utiliser la fonction buildAvatarUrl du module url.utils à la place
     */
    buildAvatarUrl(filename) {
        return buildAvatarUrl(filename);
    }


    /**
     * Télécharge et stocke la photo de profil Google
     * @param {string} pictureUrl - URL de la photo de profil Google
     * @returns {Promise<string>} Nom du fichier stocké
     */
    async downloadAndStoreGoogleProfilePicture(pictureUrl) {
        return new Promise((resolve, reject) => {
            const filename = `google_${Date.now()}.jpg`;
            const filepath = path.join('uploads', filename);

            const file = fs.createWriteStream(filepath);

            https.get(pictureUrl, (response) => {
                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve(filename);
                });
            }).on('error', (err) => {
                fs.unlink(filepath, () => {}); // Supprime le fichier en cas d'erreur
                reject(err);
            });
        });
    }

    /**
     * Crée un profil pour un utilisateur existant.
     * @param {string} userID - UUID de l'utilisateur.
     * @param {string} display_name - Nom d'utilisateur affiché.
     * @param {string} username - Nom d'utilisateur unique.
     * @param {string} [bio] - Bio de l'utilisateur.
     * @param {string|Object} file - Fichier de photo de profil ou URL Google.
     * @returns {Promise<Object>} Le profil créé.
     * @throws {Error} Si l'utilisateur n'existe pas, si le username est pris ou si une erreur interne survient.
     */
    async createProfile(userID, username, display_name, bio, file) {
        console.log("Creating new profile", userID, username, display_name, bio, file);
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }

        let existingProfile = await ProfilesRepository.findByUsername(username);
        if (existingProfile) {
            throw {message: ErrorCodes.Profiles.UsernameTaken};
        }

        let avatar_url = null;

        try {
            // Si file est une URL (photo Google), on la télécharge
            if (typeof file === 'string' && file.startsWith('http')) {
                avatar_url = await this.downloadAndStoreGoogleProfilePicture(file);
            } else if (file && file.filename) {
                // Si c'est un fichier uploadé normalement
                avatar_url = file.filename;
            }

            const profile = await ProfilesRepository.create({
                userID,
                display_name,
                username,
                bio: bio || null,
                avatar_url
            });

            // Construire l'URL complète de l'avatar si elle existe
            profile.avatar_url = buildAvatarUrl(profile.avatar_url);

            return profile;
        } catch (error) {
            console.log(error);
            throw {message: ErrorCodes.Profiles.CreationFailed};
        }
    }

    /**
     * Récupère un profil par userID, en utilisant le score stocké et en construisant l'URL complète de l'avatar.
     * @param {string} userID - UUID de l'utilisateur dont on veut le profil.
     * @param {string} [requestingUserID] - UUID de l'utilisateur qui fait la demande (pour vérifier s'il suit le profil).
     * @returns {Promise<Object>} Le profil trouvé avec l'URL complète de l'avatar et le statut de follow.
     * @throws {Error} Si le profil n'existe pas.
     */
    async getProfileByUserID(userID, requestingUserID) {
        const profile = await ProfilesRepository.findByUserID(userID);
        if (!profile) {
            throw {message: ErrorCodes.Profiles.NotFound};
        }

        // Utiliser le score stocké dans le profil au lieu de le recalculer
        // Si le score est 0, on peut le mettre à jour (cas d'un nouveau profil)
        if (profile.score === 0) {
            const UsersService = require('./users.service');
            await UsersService.updateUserScore(userID);
            // Récupérer le profil mis à jour
            const updatedProfile = await ProfilesRepository.findByUserID(userID);
            if (updatedProfile) {
                profile.score = updatedProfile.score;
            }
        }

        // Construire l'URL complète de l'avatar si elle existe
        profile.avatar_url = buildAvatarUrl(profile.avatar_url);

        // Vérifier si l'utilisateur qui fait la demande suit ce profil
        if (requestingUserID && requestingUserID !== userID) {
            const FollowsRepository = require('../repository/follows.repository');
            const isFollowing = await FollowsRepository.isFollowing(requestingUserID, userID);
            profile.dataValues.isFollowing = !!isFollowing;
        } else {
            profile.dataValues.isFollowing = false;
        }

        return profile;
    }

    /**
     * Met à jour l'URL de l'avatar pour un utilisateur donné.
     * @param {string} userID - UUID de l'utilisateur.
     * @param {Object} file - Objet file contenant les informations sur le fichier uploadé.
     * @returns {Promise<string>} URL complète de l'avatar mis à jour.
     * @throws {Error} Si le profil n'existe pas.
     */
     async updateAvatar(userID, file) {
        const profile = await ProfilesRepository.findByUserID(userID);
        if (!profile) {
            throw { message: 'Profile not found' };
        }

        const avatar_url = file.filename; // Nom du fichier stocké
        await ProfilesRepository.updateAvatar(userID, avatar_url);

        // Retourner l'URL complète de l'avatar
        return buildAvatarUrl(avatar_url);
    }

}

module.exports = new ProfilesService();