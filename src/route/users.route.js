const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
<<<<<<< Updated upstream
const UsersService = require('../services/users.service');
=======
const { sendEmail } = require('../core/emailService');
const userService = require('../services/users.service');
const { checkVerifiedUser } = require('../core/middlewares/authMiddleware');
>>>>>>> Stashed changes
const router = express.Router();

// Créer un nouvel utilisateur
router.post(
    '/register',
    body('email').isEmail().withMessage('Email invalide'),
    body('password').isStrongPassword({
        minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1,
    }).withMessage('Mot de passe trop faible'),
    body('name').notEmpty().withMessage('Le nom est requis'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role invalide'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation échouée',
                errors: errors.array(),
            });
        }

        try {
            const user = await UsersService.createUser(req.body);
            res.status(201).json({
                success: true,
                message: 'Utilisateur créé avec succès',
                data: user,
            });
        } catch (error) {
            res.status(409).json({ success: false, message: error.message });
        }
    }
);

// Obtenir tous les utilisateurs
router.get('/', async (req, res) => {
    const users = await UsersService.getAllUsers();
    res.json(users);
});

// Obtenir un utilisateur par ID
router.get('/:id', async (req, res) => {
    try {
        const user = await UsersService.getUserById(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

// Mettre à jour les informations de connexion
router.put('/auth/:id', 
    body('prevPassword').notEmpty(),
    body('password').notEmpty(),
    body('email').isEmail(),
    async (req, res) => {
<<<<<<< Updated upstream
=======
        console.log("Route POST /users atteinte !");
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

>>>>>>> Stashed changes
        try {
            await UsersService.updateUserLogin(req.params.id, req.body);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    });

// Mettre à jour le nom de l'utilisateur
router.put('/:id', body('name').notEmpty(), async (req, res) => {
    try {
        const updatedUser = await UsersService.updateUser(req.params.id, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
    try {
        await UsersService.deleteUser(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

<<<<<<< Updated upstream
module.exports = router;
=======
// Confirmer un compte utilisateur
router.get('/confirm/:token', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

        const user = await userService.getUserById(decoded.userID);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Compte déjà vérifié' });
        }

        await userService.updateUser(user.userID, { isVerified: true });
        res.status(200).json({ message: 'Compte vérifié avec succès !' });
    } catch (error) {
        console.error('Erreur lors de la vérification du compte :', error.message);
        res.status(400).json({ message: 'Lien de confirmation invalide ou expiré' });
    }
});

// Route protégée
router.get('/protected-route', checkVerifiedUser, async (req, res) => {
    res.status(200).json({ message: 'Bienvenue sur une route protégée !' });
});

module.exports = {
    initializeRoutes: () => router,
};
>>>>>>> Stashed changes
