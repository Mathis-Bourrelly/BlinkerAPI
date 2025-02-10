const jwt = require('jsonwebtoken');
const userService = require('../../services/users.service');

exports.verifyToken = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'Accès non autorisé : Token manquant' });
    }

    try {
        // Vérification et extraction des données du token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Stocker les infos de l'utilisateur dans req.user

        next(); // Passer à l'étape suivante
    } catch (error) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

exports.checkVerifiedUser = async (req, res, next) => {
    try {
        // Vérifier si l'utilisateur connecté existe
        const user = await userService.getUserById(req.user.userID);
        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier si l'utilisateur a bien confirmé son compte
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Votre compte n’est pas encore vérifié.' });
        }

        next(); // Passer à l'étape suivante
    } catch (error) {
        return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};
