const User = require('../models/users');

const UsersRepository = {
    // Créer un utilisateur
    async createUser({ name, email, password, isVerified }) {
        return await User.create({
            name,
            email,
            password, // Le mot de passe est déjà hashé dans la couche service
            isVerified,
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
            attributes: { exclude: ['password'] },
        });
    },

    // Obtenir un utilisateur par son email
    async getUserByEmail(email) {
        return await User.findOne({ where: { email } });
    },

    async updateUser(userID, updates) {
        const user = await User.findByPk(userID);
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        await user.update(updates);

        return user;
    },

    async deleteUser(userID) {
        return await User.destroy({ where: { userID } });
    },
};

module.exports = UsersRepository;
