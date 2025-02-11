const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UsersService = require("./users.service");

class AuthService {
    /**
     * Authentifie un utilisateur et génère un JWT.
     */
    async login({ email, password }) {
        const user = await UsersService.getUserByEmail(email);
        if (!user) {
            const error = new Error("Adresse e-mail ou mot de passe incorrect.");
            error.status = 401;
            throw error;
        }

        if (!user.isVerified) {
            const error = new Error("Votre compte n'est pas encore confirmé.");
            error.status = 403;
            throw error;
        }

        if (!bcrypt.compareSync(password, user.password)) {
            const error = new Error("Adresse e-mail ou mot de passe incorrect.");
            error.status = 401;
            throw error;
        }

        // Générer un jeton JWT
        const token = jwt.sign(
            { userID: user.userID, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return { token, message: "Connexion réussie !" };
    }

    /**
     * Vérifie un jeton JWT et retourne les données décodées.
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { message: "Jeton valide.", decoded };
        } catch (error) {
            throw new Error("Jeton invalide ou expiré.");
        }
    }
}

module.exports = new AuthService();