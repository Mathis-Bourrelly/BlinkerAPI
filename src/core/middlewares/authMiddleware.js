const jwt = require("jsonwebtoken");
const userService = require("../../services/users.service");

exports.verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        //console.log("authHeader", authHeader);
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Accès non autorisé : Aucun token fourni" });
        }

        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            //console.log("✅ Utilisateur extrait du token:", decoded);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: "Token invalide ou expiré" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Erreur interne lors de la vérification du token" });
    }
};

exports.checkVerifiedUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user.userID) {
            return res.status(401).json({ error: "Accès non autorisé : Identité utilisateur inconnue" });
        }

        const user = await userService.getUserById(req.user.userID);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: "Votre compte n’est pas encore vérifié." });
        }

        next();
    } catch (error) {
        return res.status(500).json({ error: "Erreur interne du serveur" });
    }
};