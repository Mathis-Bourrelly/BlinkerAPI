const express = require('express');
const router = express.Router();
const BlinkService = require('../services/blinks.service.js');
const AuthMiddleware = require("../../src/core/middlewares/authMiddleware");

router.post('/', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { contents } = req.body;
        const userID = req.user.userID; // Récupération du userID depuis le token

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        const blink = await BlinkService.createBlinkWithContent({ userID, contents });
        return res.status(201).json(blink);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.get('/:blinkID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { blinkID } = req.params;
        const blink = await BlinkService.getBlinkById(blinkID);

        if (!blink) {
            return res.status(404).json({ error: 'Blink non trouvé' });
        }

        return res.status(200).json(blink);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.put('/:blinkID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { blinkID } = req.params;
        const { contents } = req.body;

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        const updatedBlink = await BlinkService.updateBlink(blinkID, { contents });
        return res.status(200).json(updatedBlink);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete('/:blinkID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { blinkID } = req.params;
        await BlinkService.deleteBlink(blinkID);
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};