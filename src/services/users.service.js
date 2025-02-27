const UsersRepository = require('../repository/users.repository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {sendEmail} = require('../core/emailService');
const profilesService = require("./profiles.service");

const UsersService = {

    async createUser({username, display_name, bio, email, password, name }) {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await UsersRepository.getUserByEmail(email);
        if (existingUser) {
            const error = new Error("Un utilisateur avec cet email existe déjà");
            error.status = 409;
            throw error;
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser = await UsersRepository.createUser({
            email,
            password: hashedPassword,
            name,
            isVerified: false
        });

        await this.sendConfirmationEmail(newUser);
        await profilesService.createProfile(newUser.userID,username,display_name,bio,"https://i.pravatar.cc/64");

        return {
            message: "Utilisateur créé avec succès, veuillez confirmer votre compte.",
            userID: newUser.userID
        };
    },

    async getAllUsers() {
        return await UsersRepository.getAllUsers();
    },

    async getUserById(userID) {
        const user = await UsersRepository.getUserById(userID);

        if (!user) {
            const error = new Error("Utilisateur non trouvé");
            error.status = 404;
            throw error;
        }

        return user;
    },

    async getUserByEmail(email) {
        const user = await UsersRepository.getUserByEmail(email);

        if (!user) {
            const error = new Error("Utilisateur non trouvé");
            error.status = 404;
            throw error;
        }

        return user;
    },

    async deleteUser(userID) {
        const user = await UsersRepository.getUserById(userID);
        if (!user) {
            const error = new Error("Utilisateur non trouvé");
            error.status = 404;
            throw error;
        }

        await UsersRepository.deleteUser(userID);
    },

    async grantUser(req, userID) {
        if (!req.user || req.user.role !== 'admin') {
            throw new Error('Accès refusé : vous devez être administrateur');
        }

        const user = await UsersRepository.getUserById(userID);
        if (!user) throw new Error('Utilisateur non trouvé');

        if (user.role === 'admin') {
            throw new Error('Cet utilisateur est déjà administrateur');
        }

        user.role = 'admin';
        await UsersRepository.updateUser(userID, { role: 'admin' });

        return { message: "L'utilisateur a été promu administrateur" };
    },

    async confirmUser(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UsersRepository.getUserById(decoded.userID);

            if (!user) {
                const error = new Error("Utilisateur non trouvé");
                error.status = 404;
                throw error;
            }

            if (user.isVerified) {
                const error = new Error("Compte déjà vérifié");
                error.status = 400;
                throw error;
            }

            // Mise à jour du statut de vérification
            await UsersRepository.updateUser(user.userID, { isVerified: true });

            return { message: "Compte vérifié avec succès !" };
        } catch (error) {
            console.error("Erreur lors de la vérification du compte :", error.message);
            throw new Error("Lien de confirmation invalide ou expiré");
        }
    },

    async updateUser(userID, updates) {
        const user = await UsersRepository.getUserById(userID);

        if (!user) {
            const error = new Error("Utilisateur non trouvé");
            error.status = 404;
            throw error;
        }

        // Vérifier si le mot de passe est à mettre à jour
        if (updates.password) {
            const bcrypt = require('bcryptjs');
            updates.password = bcrypt.hashSync(updates.password, 10);
        }

        // Met à jour uniquement les champs fournis
        await UsersRepository.updateUser(userID, updates);

        return { message: "Utilisateur mis à jour avec succès" };
    },

    async sendConfirmationEmail(user) {
        try {
            const token = jwt.sign(
                { userID: user.userID },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            const confirmationUrl = `${process.env.BASE_URL || 'http://localhost:3011'}/users/confirm/${token}`;

            const subject = 'Confirmation de votre compte Blinker';
            const text = `Cliquez sur ce lien pour valider votre compte : ${confirmationUrl}`;
            const html = `
            <h1>Confirmation de votre compte</h1>
            <p>Cliquez sur <a href="${confirmationUrl}">ce lien</a> pour valider votre compte.</p>
        `;

            await sendEmail(user.email, subject, text, html);

            console.log(`📧 Email de confirmation envoyé à ${user.email}`);
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi de l'email à ${user.email} :`, error.message);
            throw new Error('Impossible d’envoyer l’email de confirmation.');
        }
    },

    async requestPasswordReset(email) {
        try {
            const user = await UsersRepository.getUserByEmail(email);
            if (!user) {
                throw new Error("Utilisateur non trouvé");
            }

            const token = jwt.sign(
                { userID: user.userID },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            const resetUrl = `${process.env.BASE_URL}/users/reset-password/${token}`;

            const subject = "Réinitialisation de votre mot de passe Blinker";
            const text = `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`;
            const html = `
                <h1>Réinitialisation de votre mot de passe</h1>
                <p>Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur <a href="${resetUrl}">ce lien</a> pour définir un nouveau mot de passe.</p>
                <p>Ce lien est valable pendant 1 heure.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            `;

            await sendEmail(user.email, subject, text, html);

            console.log(`📧 Email de réinitialisation envoyé à ${user.email}`);
        } catch (error) {
            console.error(`❌ Erreur lors de l'envoi de l'email à ${user.email} :`, error.message);
            throw new Error("Impossible d’envoyer l’email de réinitialisation.");
        }
    },

    async resetPassword(token, newPassword) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UsersRepository.getUserById(decoded.userID);

            if (!user) {
                throw new Error("Utilisateur non trouvé");
            }

            if (!newPassword || newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
                throw new Error("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole");
            }

            const hashedPassword = bcrypt.hashSync(newPassword, 10);

            await UsersRepository.updateUser(user.userID, { password: hashedPassword });

            return { message: "Mot de passe mis à jour avec succès" };
        } catch (error) {
            console.error("Erreur lors de la réinitialisation du mot de passe :", error.message);
            throw new Error("Token invalide ou expiré");
        }
    }
};

module.exports = UsersService;