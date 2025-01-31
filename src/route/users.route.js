const express = require('express');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const UsersService = require('../services/users.service');
const {sendEmail} = require('../core/emailService');
const {checkVerifiedUser} = require('../core/middlewares/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Créer un nouvel utilisateur.
 *     description: Enregistrer un nouvel utilisateur avec un email, un mot de passe, un nom et un rôle facultatif.
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Validation échouée
 *       409:
 *         description: Conflit, utilisateur existant
 */
router.post('/register',
    body('email').isEmail().withMessage('invalid_email'),

    body('name').notEmpty().withMessage('name_required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, message:  errors.array()[0].msg, errors: errors.array(),
            });
        }

        try {
            const user = await UsersService.createUser(req.body);
            res.status(201).json({
                success: true, message: 'Utilisateur créé avec succès, email de confirmation envoyé', data: user,
            });
        } catch (error) {
            res.status(409).json({success: false, message: error.message});
        }
    });

//TODO grant to admin route


/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtenir tous les utilisateurs.
 *     description: Récupère une liste de tous les utilisateurs.
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Une liste d'utilisateurs
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', async (req, res) => {
    try {
        const users = await UsersService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID.
 *     description: Récupère un utilisateur à partir de son ID.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await UsersService.getUserById(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(404).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /users/auth/{id}:
 *   put:
 *     summary: Mettre à jour les informations de connexion de l'utilisateur.
 *     description: Met à jour l'email et le mot de passe de l'utilisateur en vérifiant l'ancien mot de passe.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prevPassword:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Informations mises à jour avec succès
 *       400:
 *         description: Erreurs de validation
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.put('/auth/:id', body('prevPassword').notEmpty().withMessage('Previous password is required'), body('password').notEmpty().withMessage('New password is required'), body('email').isEmail().withMessage('Valid email is required'), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const user = await UsersService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        // Vérifie que l'ancien mot de passe correspond
        if (user.password !== req.body.prevPassword) {
            return res.status(401).json({message: 'Incorrect previous password'});
        }
        // Met à jour l'utilisateur avec le nouveau mot de passe et l'email
        user.password = req.body.password;
        user.email = req.body.email;

        await userService.updateUser(user); // Implémente `updateUser` dans ton service
        res.status(200).json({message: 'User updated successfully', user});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Obtenir un utilisateur par email.
 *     description: Récupère un utilisateur à partir de son email.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/email/:email', async (req, res) => {
    try {
        const user = await UsersService.getUserByEmail(req.params.email);
        if (!user) return res.status(404).json({message: 'User not found'});
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Créer un utilisateur.
 *     description: Ajoute un nouvel utilisateur.
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Erreur de validation
 */
router.post('/', body('email').isEmail(), body('password').isLength({min: 8}), body('name').notEmpty(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        const newUser = await UsersService.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({message: error.message});
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur par ID.
 *     description: Met à jour les informations d'un utilisateur.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       204:
 *         description: Mise à jour réussie
 *       400:
 *         description: Erreur de validation
 */
router.put('/:id', body('name').optional().notEmpty(), body('email').optional().isEmail(), body('password').optional().isLength({min: 8}), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    try {
        await UsersService.updateUser(req.params.id, req.body);
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour le nom d'un utilisateur par ID.
 *     description: Met à jour uniquement le nom d'un utilisateur.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nouveau nom de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id', body('name').notEmpty(), async (req, res) => {
    try {
        const updatedUser = await UsersService.updateUser(req.params.id, req.body);
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(404).json({message: error.message});
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur par ID.
 *     description: Supprime un utilisateur en utilisant son ID.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       204:
 *         description: Utilisateur supprimé avec succès
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete('/:id', async (req, res) => {
    try {
        await UsersService.deleteUser(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        res.status(404).json({message: error.message});
    }
});

/**
 * @swagger
 * /users/confirm/{token}:
 *   get:
 *     summary: Confirmer un compte utilisateur.
 *     description: Vérifie un compte utilisateur à l'aide d'un token de confirmation.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de confirmation
 *     responses:
 *       200:
 *         description: Compte vérifié avec succès
 *       400:
 *         description: Lien de confirmation invalide ou expiré
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/confirm/:token', async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

        const user = await UsersService.getUserById(decoded.userID);

        if (!user) {
            return res.status(404).json({message: 'Utilisateur non trouvé'});
        }

        if (user.isVerified) {
            return res.status(400).json({message: 'Compte déjà vérifié'});
        }

        await UsersService.verifyUser(user);
        res.status(200).json({message: 'Compte vérifié avec succès !'});
    } catch (error) {
        console.error('Erreur lors de la vérification du compte :', error.message);
        res.status(400).json({message: 'Lien de confirmation invalide ou expiré'});
    }
});

// Route protégée
router.get('/protected-route', checkVerifiedUser, async (req, res) => {
    res.status(200).json({message: 'Bienvenue sur une route protégée !'});
})

// Supprimer un utilisateur par ID
router.delete('/:id', async (req, res) => {
    try {
        const result = await UsersService.deleteUser(req.params.id);
        if (!result) return res.status(404).json({message: 'User not found'});
        res.status(204).send();
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

router.post('/send-test-email/', async (req, res) => {
    try {

        const userID = req.body.userID;
        if (!userID) {
            return res.status(400).send('ID utilisateur requis pour l’envoi de l’e-mail de confirmation.');
        }
        const user = await UsersService.getUserById(userID);
        if (!user) {
            return res.status(400).send('ID utilisateur inconnue.');
        }
        // Génération du token de confirmation
        const token = jwt.sign({ userID: userID }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Construire le lien de confirmation
        const confirmationLink = `${req.protocol}://${req.get('host')}/users/confirm/${token}`;
        // Construire le contenu de l'email
        const htmlContent = `
            <h1>Confirmation de compte</h1>
            <p>Cliquez sur le lien ci-dessous pour vérifier votre compte :</p>
            <a href="${confirmationLink}">Vérifier mon compte</a>
        `;

        const subject = req.body.subject || 'Confirmation de votre compte';
        const text = req.body.text || `Cliquez sur le lien suivant pour confirmer votre compte : ${confirmationLink}`;
        const to = user.email;

        await sendEmail(to, subject, text, htmlContent);
        res.status(200).send('E-mail de confirmation envoyé avec succès !');
    } catch (error) {
        console.error('Erreur lors de l’envoi de l’e-mail :', error.message);
        res.status(500).send('Échec de l’envoi de l’e-mail.');
    }
});

module.exports = {
    initializeRoutes: () => router,
}
