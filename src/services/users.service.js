const UsersRepository = require('../repository/users.repository');
const bcrypt = require('bcryptjs');

const UsersService = {
    // Créer un utilisateur avec validations métier
    async createUser(body) {
        const { email, role = 'user', password, name } = body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await UsersRepository.getUserByEmail(email);
        if (existingUser) {
            throw new Error('Cet email est déjà utilisé');
        }

        // Vérifier que le rôle est valide
        if (!['user', 'admin'].includes(role)) {
            throw new Error('Role invalide, il doit être "user" ou "admin"');
        }

        // Hasher le mot de passe
        const hashedPassword = bcrypt.hashSync(password, 12);

        // Appel au repository pour créer l'utilisateur
        const newUser = await UsersRepository.createUser({
            name,
            email,
            password: hashedPassword,
            role,
        });

        // Retourner les données sans le mot de passe
        return {
            id: newUser.userID,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
        };
    },

    // Récupérer tous les utilisateurs
    async getAllUsers() {
        return await UsersRepository.getAllUsers();
    },

    // Récupérer un utilisateur par ID
    async getUserById(userID) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) throw new Error('Utilisateur non trouvé');
        return user;
    },

    // Mettre à jour les informations de connexion (email + mot de passe)
    async updateUserLogin(userID, data) {
        const { prevPassword, password, email } = data;
        const foundUser = await UsersRepository.getUserById(userID);

        if (!foundUser) throw new Error('Utilisateur non trouvé');

        // Vérification du mot de passe précédent
        if (!bcrypt.compareSync(prevPassword, foundUser.password)) {
            throw new Error('Mot de passe précédent incorrect');
        }

        // Mise à jour des données
        const hashedPassword = bcrypt.hashSync(password, 12);
        await UsersRepository.updateUserLogin(userID, { password: hashedPassword, email });
    },

    // Mettre à jour le nom de l'utilisateur
    async updateUser(userID, data) {
        return await UsersRepository.updateUser(userID, data);
    },

    // Supprimer un utilisateur
    async deleteUser(userID) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) throw new Error('Utilisateur non trouvé');
        await UsersRepository.deleteUser(userID);
    },
};

module.exports = UsersService;
