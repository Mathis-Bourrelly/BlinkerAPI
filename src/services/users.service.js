const UsersRepository = require('../repository/users.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {sendEmail} = require('../core/emailService');
const ProfilesService = require("./profiles.service");
const ErrorCodes = require("../../constants/errorCodes");

const UsersService = {
    async createUser(username, display_name, bio, email, password, is_google) {

        const existingUser = await UsersRepository.getUserByEmail(email);
        if (existingUser) {
            throw {message: ErrorCodes.User.EmailAlreadyExists};
        }
        console.log(is_google)
        if (is_google) {
            console.log({username, display_name, bio, email, password})
            try {
                const newUser = await UsersRepository.createUser({
                    email,
                    isVerified: true
                });

                await ProfilesService.createProfile(newUser.userID, username, display_name, bio, "https://i.pravatar.cc/64");

                return {userID: newUser.userID};
            } catch (error) {
                console.log("bbbbbbbbb",error);
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
                await ProfilesService.createProfile(newUser.userID, username, display_name, bio, "https://i.pravatar.cc/64");

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

module.exports = UsersService;
