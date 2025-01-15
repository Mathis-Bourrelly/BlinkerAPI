const userRepository = require('../repository/users.repository');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async () => {
    return await userRepository.getAllUsers();
};

exports.getUserById = async (id) => {
    return await userRepository.getUserById(id);
};

exports.getUserByEmail = async (email) => {
    return await userRepository.getUserByEmail(email);
};

exports.createUser = async (data) => {
    const existingUser = await userRepository.getUserByEmail(data.email);
    if (existingUser) {
        throw new Error('User already exists');
    }

    // Hachage du mot de passe
    data.password = bcrypt.hashSync(data.password, 12);

    // Création de l'utilisateur
    const newUser = await userRepository.createUser(data);

    // Envoi de l'e-mail de bienvenue
    try {
        await sendWelcomeEmail(newUser.email, newUser.name);
    } catch (error) {
        console.error('Failed to send welcome email:', error.message);
    }

    // Supprime le mot de passe avant de retourner la réponse
    newUser.password = undefined;
    return newUser;
};

exports.updateUser = async (id, data) => {
    if (data.password) {
        // Hachage du mot de passe si fourni
        data.password = bcrypt.hashSync(data.password, 12);
    }

    return await userRepository.updateUser(id, data);
};

exports.deleteUser = async (id) => {
    return await userRepository.deleteUser(id);
};
