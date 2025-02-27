const express = require('express');
const jwt = require('jsonwebtoken');
const {body, validationResult} = require('express-validator');
const UsersService = require('../services/users.service');
const {sendEmail} = require('../core/emailService');
const AuthMiddleware = require('../core/middlewares/authMiddleware');
const router = express.Router();

router.post('/register',
    body('email').isEmail().withMessage('invalid_email'),
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

router.get('/', async (req, res) => {
    try {
        const result = await UsersService.getAllUsers();
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await UsersService.getUserById(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message });
    }
});

router.get('/email/:email', async (req, res) => {
    try {
        const result = await UsersService.getUserByEmail(req.params.email);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

router.post('/',
    body('email').isEmail().withMessage("L'email doit être valide"),
    body('password').isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }).withMessage("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole"),
    async (req, res) => {
        try {
            const result = await UsersService.createUser(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(error.status || 400).json({ message: error.message });
        }
    }
);

router.put('/:id',
    AuthMiddleware.verifyToken,
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

router.get('/confirm/:token', async (req, res) => {
    try {
        const result = await UsersService.confirmUser(req.params.token);
        res.status(200).json(result);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
});

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
