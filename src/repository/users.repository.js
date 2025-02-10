const User = require('../model/users');
const bcrypt = require('bcryptjs');

const UsersRepository = {
    // Créer un utilisateur
    async createUser({ name, email, password }) {
        return await User.create({
            name,
            email,
            password, // Le mot de passe est déjà hashé dans la couche service
        });
    },

    // Obtenir tous les utilisateurs
    async getAllUsers() {
        return await User.findAll({
            attributes: { exclude: ['password'] }, // Exclure le mot de passe des résultats
        });
    },

    // Obtenir un utilisateur par son ID
    async getUserById(userID) {
        return await User.findByPk(userID, {
            attributes: { exclude: ['password'] }, // Sécurité : Ne pas renvoyer le mot de passe
        });
    },

    // Obtenir un utilisateur par son email
    async getUserByEmail(email) {
        return await User.findOne({ where: { email } });
    },

    // Mettre à jour les informations de connexion (email et mot de passe)
    async updateUserLogin(userID, { email, password }) {
        return await User.update(
            { email, password },
            { where: { userID } }
        );
    },

    async updateUser(userID, updates) {
        const user = await User.findByPk(userID);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        await user.update(updates);

        return user;
    },

    async verifyUser(userID) {
        return await User.update(
            { isVerified: true },
            { where: { userID } }
        );
    },

    async deleteUser(userID) {
        return await User.destroy({ where: { userID } });
    },
};

module.exports = UsersRepository;
