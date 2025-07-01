const User = require('../models/users');
const Profiles = require('../models/profiles');
const { Op } = require('sequelize');
const ErrorCodes = require("../../constants/errorCodes");
const BaseRepository = require('./base.repository');
const { createError } = require('../utils/error.utils');

class UsersRepository extends BaseRepository {
    constructor() {
        super(User, ErrorCodes.User);
    }
    /**
     * Créer un utilisateur.
     * @param {Object} userData - Données de l'utilisateur
     * @param {string} userData.email - Email de l'utilisateur
     * @param {string} [userData.password] - Mot de passe hashé (optionnel pour auth Google)
     * @param {boolean} userData.isVerified - Statut de vérification
     * @returns {Promise<Object>} L'utilisateur créé
     */
    async createUser(userData) {
        return this.create(userData);
    }

    /**
     * Obtenir tous les utilisateurs.
     * @returns {Promise<Array>} Liste des utilisateurs
     */
    async getAllUsers() {
        return this.findAll({
            attributes: { exclude: ['password'] }
        });
    }

    /**
     * Obtenir un utilisateur par son ID.
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<Object>} L'utilisateur trouvé
     */
    async getUserById(userID) {
        return this.findById(userID, {
            attributes: { exclude: ['password'] }
        });
    }

    /**
     * Obtenir un utilisateur par son email.
     * @param {string} email - Email de l'utilisateur
     * @returns {Promise<Object|null>} L'utilisateur trouvé ou null
     */
    async getUserByEmail(email) {
        try {
            return await User.findOne({ where: { email } });
        } catch (error) {
            throw createError(ErrorCodes.User.FetchFailed, error);
        }
    }

    /**
     * Mettre à jour un utilisateur.
     * @param {string} userID - ID de l'utilisateur
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<Object>} L'utilisateur mis à jour
     */
    async updateUser(userID, updates) {
        return this.update(userID, updates);
    }

    /**
     * Supprimer un utilisateur.
     * @param {string} userID - ID de l'utilisateur
     * @returns {Promise<boolean>} true si supprimé avec succès
     */
    async deleteUser(userID) {
        return this.delete(userID);
    }

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
            throw createError(ErrorCodes.User.SearchFailed, error);
        }
    }
}

module.exports = new UsersRepository();