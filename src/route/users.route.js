const express = require('express');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const UsersService = require('../services/users.service');
const {sendEmail} = require('../core/emailService');
const AuthMiddleware = require('../core/middlewares/authMiddleware');
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
            console.log(error);
            res.status(409).json({success: false, message: error.message});
        }
    });

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtenir tous les utilisateurs.
 *     description: Récupère une liste de tous les utilisateurs enregistrés.
 *     tags: [users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/', async (req, res) => {
    try {
        const result = await UsersService.getAllUsers();
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID.
 *     description: Récupère un utilisateur à partir de son ID unique.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à rechercher
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await UsersService.getUserById(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Obtenir un utilisateur par email.
 *     description: Récupère un utilisateur à partir de son adresse email.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: Email de l'utilisateur à rechercher
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
        const result = await UsersService.getUserByEmail(req.params.email);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Créer un utilisateur.
 *     description: Ajoute un nouvel utilisateur avec un email, un mot de passe sécurisé et un nom.
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
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *               password:
 *                 type: string
 *                 description: Mot de passe sécurisé (minimum 12 caractères, majuscules, minuscules, chiffres et symboles requis)
 *               name:
 *                 type: string
 *                 description: Nom de l'utilisateur
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Conflit - l'utilisateur existe déjà
 */
router.post('/',
    body('email').isEmail().withMessage("L'email doit être valide"),
    body('password').isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole"),
    body('name').notEmpty().withMessage("Le nom ne peut pas être vide"),
    async (req, res) => {
        try {
            const result = await UsersService.createUser(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(error.status || 400).json({ message: error.message });
        }
    }
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur.
 *     description: Met à jour les informations d'un utilisateur (nom, email, mot de passe, etc.).
 *     tags: [users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur à mettre à jour
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
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Nouvelle adresse email
 *               password:
 *                 type: string
 *                 description: Nouveau mot de passe (au moins 8 caractères)
 *     responses:
 *       204:
 *         description: Utilisateur mis à jour avec succès
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id',
    AuthMiddleware.verifyToken,
    body('name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
    body('email').optional().isEmail().withMessage('L\'email doit être valide'),
    body('password').optional().isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    async (req, res) => {
        try {
            await UsersService.updateUser(req.params.id, req.body);
            res.sendStatus(204);
        } catch (error) {
            res.status(error.status || 400).json({ success: false, message: error.message });
        }
    }
);

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
        const result = await UsersService.confirmUser(req.params.token);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur par ID.
 *     description: Supprime un utilisateur en utilisant son ID.
 *     tags: [users]
 *     security:
 *       - BearerAuth: []
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
router.delete('/:id', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        await UsersService.deleteUser(req.params.id);
        res.sendStatus(204);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
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

/**
 * @swagger
 * /users/grant-admin/{userID}:
 *   post:
 *     summary: Accorder le rôle d'administrateur à un utilisateur
 *     description: Permet à un administrateur de promouvoir un utilisateur au rôle d'administrateur.
 *     tags: [users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userID
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur à promouvoir
 *     responses:
 *       200:
 *         description: L'utilisateur a été promu administrateur avec succès
 *       403:
 *         description: Accès refusé - seul un administrateur peut accorder ce rôle
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/grant-admin/:userID',
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkVerifiedUser,
    async (req, res) => {
        try {
            const result = await UsersService.grantUser(req, req.params.userID);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    });

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Demander une réinitialisation de mot de passe
 *     description: Envoie un email de réinitialisation de mot de passe si l'utilisateur existe.
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
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé si l'utilisateur existe
 *       400:
 *         description: Validation échouée
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/reset-password',
    body('email').isEmail().withMessage('invalid_email'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false, message: errors.array()[0].msg, errors: errors.array(),
            });
        }

        try {
            await UsersService.requestPasswordReset(req.body.email);
            res.status(200).json({ success: true, message: 'Email de réinitialisation envoyé' });
        } catch (error) {
            res.status(error.status || 500).json({ success: false, message: error.message });
        }
    }
);

/**
 * @swagger
 * /users/reset-password/{token}:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     description: Permet à un utilisateur de définir un nouveau mot de passe après avoir demandé une réinitialisation.
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de réinitialisation du mot de passe
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Mot de passe mis à jour avec succès
 *       400:
 *         description: Erreur de validation ou token invalide
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/reset-password/:token', async (req, res) => {
    try {
        await UsersService.resetPassword(req.params.token, req.body.newPassword);
        res.status(200).json({ success: true, message: "Mot de passe mis à jour avec succès" });
    } catch (error) {
        res.status(error.status || 400).json({ success: false, message: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
}
