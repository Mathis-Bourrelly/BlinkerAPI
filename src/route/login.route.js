const express = require("express");
const {validationResult, body} = require("express-validator");
const userRepository = require("../repository/users.repository");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/status', async (req, res) => {
    res.send('ready');
});


router.post('/login',
    body('email').not().isEmpty(),
    body('password').not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const existingUser = await userRepository.getUserByEmail(req.body.email);
        if (!existingUser) {
            res.sendStatus(401)

        } else {
            if (bcrypt.compareSync(req.body.password, existingUser.password)) {
                const token = jwt.sign({email: req.body.email}, process.env.MOTDEPASSEAPP,
                //TODO { expiresIn: '1d' }
                );
                res.status(202).send({"token": token})
            } else {
                res.sendStatus(401)
            }
        }
    }
);

router.post('/auth',
    body('token').not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        if (jwt.verify(req.body.token, process.env.MOTDEPASSEAPP)) {
            res.sendStatus(202)
        } else {
            res.sendStatus(401)
        }
    }
);

exports.initializeRoutes = () => router;
