const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {OAuth2Client} = require("google-auth-library");
const UsersService = require("./users.service");
const UsersRepository = require("../repository/users.repository");
const ProfilesService = require("../services/profiles.service");
const ErrorCodes = require("../../constants/errorCodes");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class LoginService {
    /**
     * Authentifie un utilisateur et génère un JWT.
     */
    async login({email, password}) {
        if (!email || !password) {
            throw {message: ErrorCodes.Login.FieldEmailRequired};
        }

        const user = await UsersService.getUserByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw {message: ErrorCodes.Login.IncorrectPassword};
        }

        if (!user.isVerified) {
            throw {message: ErrorCodes.Login.AccountLocked};
        }

        if (!process.env.JWT_SECRET) {
            throw {message: ErrorCodes.Base.UnknownError};
        }
        const profile = await ProfilesService.getProfileByUserID(user.userID)

        const token = jwt.sign(
            {userID: user.userID, email: user.email, role: user.role, avatar_url: profile.avatar_url },
            process.env.JWT_SECRET,
            {expiresIn: "1d"}
        );

        return {
            token,
            userID: user.userID
        };
    }

    /**
     * Authentification avec Google OAuth.
     */
    async loginWithGoogle(google_token) {
        if (!google_token) {
            throw {message: ErrorCodes.Login.InvalidToken};
        }

        const ticket = await client.verifyIdToken({
            idToken: google_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw {message: ErrorCodes.Login.InvalidEmail};
        }

        const {email, given_name, name, picture} = payload;

        let user = await UsersRepository.getUserByEmail(email);
        if (!user) {
            // Crée l'utilisateur avec la photo de profil Google
            const emptyBio = "";
            const emptyPassword = "";
            user = await UsersService.createUser(
                given_name,
                name,
                emptyBio,
                email,
                emptyPassword,
                picture, // L'URL de la photo de profil Google
                true
            );
        }

        // Récupérer le profil pour avoir l'avatar_url
        const profile = await ProfilesService.getProfileByUserID(user.userID);

        if (!process.env.JWT_SECRET) {
            throw {message: ErrorCodes.Base.UnknownError};
        }

        const appToken = jwt.sign(
            {
                userID: user.userID,
                email: user.email,
                role: user.role,
                avatar_url: profile.avatar_url
            },
            process.env.JWT_SECRET,
            {expiresIn: "7d"}
        );

        return {token: appToken, userID: user.userID};
    }
}

module.exports = new LoginService();
