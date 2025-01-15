const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../core/emailService');
const userService = require('../services/users.service');
const router = express.Router();

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
            const updatedUser = await userService.updateUser(req.params.id, req.body);
            if (!updatedUser) return res.status(404).json({ message: 'User not found' });
            res.status(200).json(updatedUser);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
);

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
