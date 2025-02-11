const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const UsersService = require("./users.service");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    /**
     * Authentifie un utilisateur et génère un JWT.
     */
    async login({ email, password }) {
        if (!email || !password) {
            throw this.createError(400, "Email et mot de passe sont requis.");
        }

        const user = await UsersService.getUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw this.createError(401, "Adresse e-mail ou mot de passe incorrect.");
        }

        if (!user.isVerified) {
            throw this.createError(403, "Votre compte n'est pas encore confirmé.");
        }

        if (!process.env.JWT_SECRET) {
            throw this.createError(500, "Configuration serveur invalide : clé secrète JWT manquante.");
        }

        const token = jwt.sign(
            { userID: user.userID, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return {
            token,
            message: "Connexion réussie !",
            user: {
                userID: user.userID,
                email: user.email,
                role: user.role,
                name: user.name,
                picture: user.picture,
            },
        };
    }

    /**
     * Vérifie un jeton JWT et retourne les données décodées.
     */
    async verifyToken(token) {
        if (!token) {
            throw this.createError(400, "Aucun jeton fourni.");
        }

        if (!process.env.JWT_SECRET) {
            throw this.createError(500, "Configuration serveur invalide : clé secrète JWT manquante.");
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { message: "Jeton valide.", decoded };
        } catch (error) {
            throw this.createError(401, "Jeton invalide ou expiré.");
        }
    }

    /**
     * Authentification avec Google OAuth.
     */
    async loginWithGoogle(token) {
        if (!token) {
            throw this.createError(400, "Token Google manquant.");
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw this.createError(401, "Token invalide ou adresse e-mail manquante.");
        }

        const { sub: googleId, email, name, picture } = payload;

        let user = await UsersService.getUserByEmail(email);
        if (!user) {
            user = await UsersService.createUser({
                googleId,
                email,
                name: name || "Utilisateur inconnu",
                picture: picture || "",
                isVerified: true,
            });
        }

        const appToken = jwt.sign(
            { userID: user.userID, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return { token: appToken, user };
    }

    /**
     * Fonction utilitaire pour créer une erreur avec un statut HTTP.
     */
    createError(statusCode, message) {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    }
}

module.exports = new AuthService();