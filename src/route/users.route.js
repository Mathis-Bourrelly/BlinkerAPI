const express = require('express');
const { body, validationResult } = require('express-validator');
const UsersService = require('../services/users.service');
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

module.exports = router;
