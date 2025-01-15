const UsersRepository = require('../repository/users.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../core/emailService');

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



exports.updateUser = async (id, data) => {
    if (data.password) {
        data.password = bcrypt.hashSync(data.password, 12);
    }

    return await UsersRepository.updateUser(id, data);
};

exports.deleteUser = async (id) => {
    return await UsersRepository.deleteUser(id);
};


exports.verifyUser = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UsersRepository.getUserById(decoded.userID);

        if (!user) {
            throw new Error('User not found');
        }

        if (user.isVerified) {
            throw new Error('User is already verified');
        }

        await UsersRepository.updateUser(user.userID, { isVerified: true });
        return { message: 'User successfully verified' };
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Envoie un e-mail de confirmation pour valider l'utilisateur
 * @param {Object} user - L'utilisateur nouvellement créé
 */
const sendConfirmationEmail = async (user) => {
    const token = jwt.sign({ userID: user.userID }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const confirmationUrl = `http://localhost:3000/users/confirm/${token}`;

    await sendEmail(
        user.email,
        'Confirmation de votre compte Blinker',
        `Cliquez sur ce lien pour valider votre compte : ${confirmationUrl}`,
        `<h1>Confirmation de votre compte</h1><p>Cliquez sur <a href="${confirmationUrl}">ce lien</a> pour valider votre compte.</p>`
    );

    console.log(`Confirmation email sent to ${user.email}`);
};

