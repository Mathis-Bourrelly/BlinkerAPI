const User = require('../models/users');
const Profiles = require('../models/profiles');
const { Op } = require('sequelize');
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
            throw { message: ErrorCodes.User.CreationFailed };
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
            throw { message: ErrorCodes.User.NotFound };
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
            throw { message: ErrorCodes.User.NotFound };
        }

        try {
            await user.update(updates);
            return user;
        } catch (error) {
            throw { message: ErrorCodes.User.UpdateFailed };
        }
    },

    /**
     * Supprimer un utilisateur.
     */
    async deleteUser(userID) {
        try {
            const deleted = await User.destroy({ where: { userID } });
            if (!deleted) {
                throw { message: ErrorCodes.User.NotFound };
            }
        } catch (error) {
            throw { message: ErrorCodes.User.DeletionFailed };
        }
    },

    /**
     * Rechercher des utilisateurs par nom d'affichage ou nom d'utilisateur
     * @param {string} query - Terme de recherche
     * @param {number} page - Numéro de la page
     * @param {number} limit - Nombre d'éléments par page
     * @returns {Promise<{total: number, users: Array}>} Résultats de la recherche
     */
    async searchUsers(query, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            // Recherche dans les profils (display_name et username)
            const { count, rows } = await Profiles.findAndCountAll({
                where: {
                    [Op.or]: [
                        { display_name: { [Op.iLike]: `%${query}%` } },
                        { username: { [Op.iLike]: `%${query}%` } }
                    ]
                },
                attributes: ['userID', 'display_name', 'username', 'avatar_url', 'bio', 'score'],
                limit,
                offset,
                order: [['username', 'ASC']]
            });

            return { total: count, users: rows };
        } catch (error) {
            console.error('Erreur lors de la recherche d\'utilisateurs:', error);
            throw { message: ErrorCodes.User.SearchFailed };
        }
    }
};

module.exports = UsersRepository;