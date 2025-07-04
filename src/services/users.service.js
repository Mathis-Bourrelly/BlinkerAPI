const UsersRepository = require('../repository/users.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {sendEmail} = require('../core/emailService');
const ProfilesService = require("./profiles.service");
const ErrorCodes = require("../../constants/errorCodes");
const { sequelize } = require('../core/postgres');
const BlinkRepository = require('../repository/blinks.repository');
const BlinkLifetimesRepository = require('../repository/blinkLifetimes.repository');

const UsersService = {
    /**
     * Recherche des utilisateurs par nom d'affichage ou nom d'utilisateur
     * @param {string} query - Terme de recherche
     * @param {number} page - Numéro de la page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<{total: number, users: Array}>} Résultats de la recherche
     */
    async searchUsers(query, page = 1, limit = 10) {
        if (!query || query.trim() === "") {
            throw { message: ErrorCodes.User.InvalidSearchQuery };
        }

        try {
            const results = await UsersRepository.searchUsers(query, Number(page), Number(limit));

            // Transformer les URLs des avatars
            if (results.users && results.users.length > 0) {
                results.users = results.users.map(user => {
                    const userData = user.toJSON ? user.toJSON() : user;
                    if (userData.avatar_url) {
                        userData.avatar_url = ProfilesService.buildAvatarUrl(userData.avatar_url);
                    }
                    return userData;
                });
            }

            return results;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            throw { message: ErrorCodes.User.SearchFailed };
        }
    },

    async createUser(username, display_name, bio, email, password, file, is_google) {

        const existingUser = await UsersRepository.getUserByEmail(email);
        if (existingUser) {
            throw {message: ErrorCodes.User.EmailAlreadyExists};
        }
        if (is_google) {
            try {
                const newUser = await UsersRepository.createUser({
                    email,
                    isVerified: true
                });

                await ProfilesService.createProfile(newUser.userID, username, display_name, bio, file);

                return {userID: newUser.userID};
            } catch (error) {
                throw {message: ErrorCodes.User.CreationFailed};
            }

        } else {
            const hashedPassword = bcrypt.hashSync(password, 10);

            try {
                const newUser = await UsersRepository.createUser({
                    email,
                    password: hashedPassword,
                    isVerified: false
                });
                //await this.sendConfirmationEmail(newUser);
                await ProfilesService.createProfile(newUser.userID, username, display_name, bio, file);

                return {userID: newUser.userID};
            } catch (error) {
                throw {message: ErrorCodes.User.CreationFailed};
            }
        }
    },

    async getAllUsers() {
        return await UsersRepository.getAllUsers();
    },

    async getUserById(userID) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }
        return user;
    },

    async getUserByEmail(email) {
        const user = await UsersRepository.getUserByEmail(email);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }
        return user;
    },

    async deleteUser(userID) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }

        try {
            await UsersRepository.deleteUser(userID);
        } catch (error) {
            throw {message: ErrorCodes.User.DeletionFailed};
        }
    },

    async grantUser(req, userID) {
        if (!req.user || req.user.role !== 'admin') {
            throw {message: ErrorCodes.Login.AccessDenied};
        }

        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }

        if (user.role === 'admin') {
            throw {message: ErrorCodes.User.AlreadyAdmin};
        }

        await UsersRepository.updateUser(userID, {role: 'admin'});

        return {message: "L'utilisateur a été promu administrateur"};
    },

    async confirmUser(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UsersRepository.getUserById(decoded.userID);

            if (!user) {
                throw {message: ErrorCodes.User.NotFound};
            }

            if (user.isVerified) {
                throw {message: ErrorCodes.User.AccountAlreadyVerified};
            }

            await UsersRepository.updateUser(user.userID, {isVerified: true});

            return {message: "Compte vérifié avec succès !"};
        } catch (error) {
            throw {message: ErrorCodes.User.InvalidResetToken};
        }
    },

    async updateUser(userID, updates) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }

        if (updates.password) {
            updates.password = bcrypt.hashSync(updates.password, 10);
        }

        try {
            await UsersRepository.updateUser(userID, updates);
        } catch (error) {
            throw {message: ErrorCodes.User.UpdateFailed};
        }

        return {message: "Utilisateur mis à jour avec succès"};
    },

    async requestPasswordReset(email) {
        const user = await UsersRepository.getUserByEmail(email);
        if (!user) {
            throw {message: ErrorCodes.User.NotFound};
        }

        const token = jwt.sign(
            {userID: user.userID},
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        const resetUrl = `${process.env.BASE_URL}/users/reset-password/${token}`;

        await sendEmail(user.email, "Réinitialisation de votre mot de passe", resetUrl, resetUrl);

        return {message: "Email de réinitialisation envoyé."};
    },

    async resetPassword(token, newPassword) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UsersRepository.getUserById(decoded.userID);

            if (!user) {
                throw {message: ErrorCodes.User.NotFound};
            }

            if (!newPassword || newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
                throw {message: ErrorCodes.User.WeakPassword};
            }

            const hashedPassword = bcrypt.hashSync(newPassword, 10);

            await UsersRepository.updateUser(user.userID, {password: hashedPassword});

            return {message: "Mot de passe mis à jour avec succès"};
        } catch (error) {
            throw {message: ErrorCodes.User.InvalidResetToken};
        }
    }
};

/**
 * Calcule le score d'un utilisateur en fonction de la durée de vie moyenne de ses blinks
 * @param {string} userID - ID de l'utilisateur
 * @returns {Promise<number>} Le score calculé (durée de vie moyenne en secondes)
 */
UsersService.calculateUserScore = async function(userID) {
    try {
        // 1. Vérifier si nous avons des données de durée de vie pour cet utilisateur
        const averageLifetime = await BlinkLifetimesRepository.getAverageLifetime(userID);

        // Si nous avons des données de durée de vie, utiliser la moyenne comme score
        if (averageLifetime) {
            console.log(`Score calculé à partir de la durée de vie moyenne: ${averageLifetime} secondes`);
            return averageLifetime;
        }

        // 2. Si nous n'avons pas de données de durée de vie, utiliser un score par défaut
        console.log(`Aucune donnée de durée de vie pour l'utilisateur ${userID}, score par défaut: 86400 (24h)`);
        return 86400; // 24h en secondes par défaut
    } catch (error) {
        console.error('Erreur lors du calcul du score:', error);
        return 86400; // 24h en secondes par défaut en cas d'erreur
    }
};

/**
 * Met à jour le score d'un utilisateur
 * @param {string} userID - ID de l'utilisateur
 * @returns {Promise<number>} Le nouveau score
 */
UsersService.updateUserScore = async function(userID) {
    try {
        // Calculer le nouveau score
        const newScore = await this.calculateUserScore(userID);

        // Mettre à jour le profil via le repository
        const ProfilesRepository = require('../repository/profiles.repository');
        await ProfilesRepository.updateScore(userID, newScore);

        console.log(`Score de l'utilisateur ${userID} mis à jour: ${newScore}`);
        return newScore;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du score de l'utilisateur ${userID}:`, error);
        throw error;
    }
};

/**
 * Met à jour les scores de tous les utilisateurs
 * @returns {Promise<number>} Le nombre d'utilisateurs mis à jour
 */
UsersService.updateAllUserScores = async function() {
    try {
        const users = await this.getAllUsers();
        let updatedCount = 0;

        for (const user of users) {
            await this.updateUserScore(user.userID);
            updatedCount++;
        }

        console.log(`Scores mis à jour pour ${updatedCount} utilisateurs`);
        return updatedCount;
    } catch (error) {
        console.error('Erreur lors de la mise à jour des scores:', error);
        throw error;
    }
};

module.exports = UsersService;
