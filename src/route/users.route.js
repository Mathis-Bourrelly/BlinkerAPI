const userRepository = require("../repository/users.repository");
const express = require("express");
const {body, validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const {expressjwt: jwt} = require("express-jwt");
const router = express.Router();
require('dotenv').config();

router.get('/', async (req, res) => {
    res.send(await userRepository.getAllUsers());
});

router.get('/:id', async (req, res) => {
    const foundUser = await userRepository.getUserById(req.params.id);

    if (!foundUser) {
        res.status(500).send('User not found')
        //throw new Error('User not found');
    } else {
        res.send(foundUser);
    }
});

router.post('/',
    body('email').not().isEmpty(),
    body('password').not().isEmpty(),
    async (req, res) => {
        const existingUser = await userRepository.getUserByEmail(req.body.email);

        if (existingUser) {
            res.status(500).send({'message': 'Unable to create the user'})
            //throw new Error('Unable to create the user');
        } else {
            let createdUser = await userRepository.createUser(req.body);
            createdUser.password = undefined
            res.status(201).send(createdUser);
        }
    });

router.put('/auth/:id',
    body('email').not().isEmpty(),
    body('prevPassword').not().isEmpty(),
    body('password').not().isEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        const existingUser = await userRepository.getUserById(req.params.id);
        if (bcrypt.compareSync(req.body.prevPassword, existingUser.password)) {
            await userRepository.updateUserLogin(req.params.id, req.body);
            res.sendStatus(204);
        }else{
            res.sendStatus(401)
        }
    });

router.put('/:id',
    body('name').not().isEmpty(),
    async (req, res) => {
    let updatedUser = await userRepository.updateUser(req.params.id, req.body);
    if (updatedUser) {
        res.status(201).send(updatedUser);
    }else {
        return res.sendStatus(404)
    }
});

router.delete('/:id', async (req, res) => {
    await userRepository.deleteUser(req.params.id);
    res.sendStatus(204);
});

exports.initializeRoutes = () => router;