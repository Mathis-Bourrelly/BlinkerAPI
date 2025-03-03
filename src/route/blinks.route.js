const express = require('express');
const router = express.Router();
const BlinkService = require('../services/blinks.service.js');
const AuthMiddleware = require("../../src/core/middlewares/authMiddleware");

router.get('/search', AuthMiddleware.verifyToken, async (req, res, next) => {
    try {
        const { query, page = 1, limit = 10 } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Le paramètre 'query' est requis." });
        }

        const result = await BlinkService.searchBlinksAndUsers(query, Number(page), Number(limit));
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.get("/", AuthMiddleware.verifyToken, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, userId } = req.query;
        const result = await BlinkService.getPaginatedBlinks(Number(page), Number(limit), userId || null);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { contents } = req.body;
        const userID = req.user.userID;

        if (!contents || !Array.isArray(contents)) {
            return res.status(400).json({ error: 'Données invalides' });
        }

        const blink = await BlinkService.createBlinkWithContent({ userID, contents });
        return res.status(201).json(blink);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.delete('/expired', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        await BlinkService.deleteExpiredBlinks();
        return res.status(200).json({ message: "Blinks expirés supprimés avec succès." });
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

router.get('/remaining-time/:blinkID', AuthMiddleware.verifyToken, async (req, res) => {
    try {
        const { blinkID } = req.params;
        const remainingTime = await BlinkService.calculateRemainingTime(blinkID);

        return res.status(200).json({ blinkID, remainingTime });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = {
    initializeRoutes: () => router,
};
