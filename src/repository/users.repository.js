const User = require('../models/users');
const ErrorCodes = require("../../constants/errorCodes");

const UsersRepository = {
    /**
     * Créer un utilisateur.
     */
    async createUser({ email, password, isVerified }) {
        try {
            return await User.create({
                email,
                password, // Le mot de passe est déjà hashé dans la couche service
                isVerified,
            });
        } catch (error) {
            throw { code: ErrorCodes.User.CreationFailed };
        }
    },

    /**
     * Obtenir tous les utilisateurs.
     */
    async getAllUsers() {
        return await User.findAll({
            attributes: { exclude: ['password'] }, // Exclure le mot de passe des résultats
        });
    },

    /**
     * Obtenir un utilisateur par son ID.
     */
    async getUserById(userID) {
        const user = await User.findByPk(userID, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            throw { code: ErrorCodes.User.NotFound };
        }

        return user;
    },

    /**
     * Obtenir un utilisateur par son email.
     */
    async getUserByEmail(email) {
        return await User.findOne({ where: { email } });
    },

    /**
     * Mettre à jour un utilisateur.
     */
    async updateUser(userID, updates) {
        const user = await User.findByPk(userID);
        if (!user) {
            throw { code: ErrorCodes.User.NotFound };
        }

        try {
            await user.update(updates);
            return user;
        } catch (error) {
            throw { code: ErrorCodes.User.UpdateFailed };
        }
    },

    /**
     * Supprimer un utilisateur.
     */
    async deleteUser(userID) {
        try {
            const deleted = await User.destroy({ where: { userID } });
            if (!deleted) {
                throw { code: ErrorCodes.User.NotFound };
            }
        } catch (error) {
            throw { code: ErrorCodes.User.DeletionFailed };
        }
    }
};

module.exports = UsersRepository;