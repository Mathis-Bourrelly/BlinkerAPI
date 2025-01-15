const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const UsersService = require('../services/users.service');
const { sendEmail } = require('../core/emailService');
const { checkVerifiedUser } = require('../core/middlewares/authMiddleware');
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
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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
        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtenir un utilisateur par email
router.get('/email/:email', async (req, res) => {
    try {
        const user = await userService.getUserByEmail(req.params.email);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Créer un utilisateur
router.post('/',
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const newUser = await userService.createUser(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
);

// Mettre à jour un utilisateur par ID
router.put('/:id',
    body('name').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 8 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await UsersService.updateUserLogin(req.params.id, req.body);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
);

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

// Supprimer un utilisateur par ID
router.delete('/:id', async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        if (!result) return res.status(404).json({ message: 'User not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/send-test-email', async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;
        await sendEmail(
            to || 'destinataire@example.com',
            subject || 'Test Email',
            text || 'Ceci est un test d’envoi d’e-mail avec un mot de passe d’application.',
            html || '<h1>Test d’e-mail</h1><p>Succès !</p>'
        );
        res.status(200).send('E-mail envoyé avec succès !');
    } catch (error) {
        console.error('Erreur lors de l’envoi de l’e-mail :', error.message);
        res.status(500).send('Échec de l’envoi de l’e-mail.');
    }
});

module.exports = {
    initializeRoutes: () => router,
};
