const jwt = require('jsonwebtoken');
const userService = require('../../services/users.service');

exports.verifyToken = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Accès non autorisé : Aucun token fourni' });
        }

        const token = authHeader.split(' ')[1]; // Extraire le token après "Bearer"
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // Ajouter les infos du token dans `req.user`
        next(); // Passer au prochain middleware
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
