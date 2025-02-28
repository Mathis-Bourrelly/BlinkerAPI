const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const UsersService = require("./users.service");
const UsersRepository = require("../repository/users.repository");
const ProfilesService = require("../services/profiles.service");
const ErrorCodes = require("../../constants/errorCodes");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
    /**
     * Authentifie un utilisateur et génère un JWT.
     */
    async login({ email, password }) {
        if (!email || !password) {
            throw { code: ErrorCodes.Login.FieldEmailRequired };
        }

        const user = await UsersService.getUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw { code: ErrorCodes.Login.IncorrectPassword };
        }

        if (!user.isVerified) {
            throw { code: ErrorCodes.Login.AccountLocked };
        }

        if (!process.env.JWT_SECRET) {
            throw { code: ErrorCodes.Base.UnknownError };
        }

        const token = jwt.sign(
            { userID: user.userID, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return {
            token,
            userID: user.userID
        };
    }

    /**
     * Vérifie un jeton JWT et retourne les données décodées.
     */
    async verifyToken(token) {
        if (!token) {
            throw { code: ErrorCodes.Login.InvalidToken };
        }

        if (!process.env.JWT_SECRET) {
            throw { code: ErrorCodes.Base.UnknownError };
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { decoded };
        } catch (error) {
            throw { code: ErrorCodes.Login.InvalidToken };
        }
    }

    /**
     * Authentification avec Google OAuth.
     */
    async loginWithGoogle(token) {
        if (!token) {
            throw { code: ErrorCodes.Login.InvalidToken };
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw { code: ErrorCodes.Login.InvalidEmail };
        }

        const { email, given_name, name, picture } = payload;

        let user = await UsersRepository.getUserByEmail(email);
        if (!user) {
            // Crée l'utilisateur
            user = await UsersRepository.createUser({
                email,
                isVerified: true
            });

            // Crée le profil associé
            await ProfilesService.createProfile({
                userID: user.userID,
                username: given_name,
                display_name: name,
                bio: "",
                avatar_url: picture
            });
        }

        const appToken = jwt.sign(
            { userID: user.userID },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return { token: appToken, userID: user.userID };
    }
}

module.exports = new AuthService();
