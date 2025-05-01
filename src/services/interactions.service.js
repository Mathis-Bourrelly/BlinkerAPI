const InteractionsRepository = require("../repository/interactions.repository");
const Blinks = require("../models/blinks");
const { Op } = require("sequelize");
const { updateBlinkTier } = require("./blinks.service");

class InteractionsService {
    /**
     * Met à jour le compteur de likes/dislikes sur un Blink en fonction de l'action effectuée.
     */
    async updateReactionCount(postID, reactionType, action) {
        try {
            // Récupérer le Blink actuel
            const blink = await Blinks.findOne({
                where: { blinkID: postID }
            });

            if (!blink) {
                throw new Error('Blink not found');
            }

            const updateValues = {};

            if (reactionType === "like") {
                if (action === "increment") {
                    updateValues.likeCount = blink.likeCount + 1;
                } else if (action === "decrement") {
                    updateValues.likeCount = Math.max(0, blink.likeCount - 1);
                } else if (action === "switch") {
                    updateValues.likeCount = blink.likeCount + 1;
                    updateValues.dislikeCount = Math.max(0, blink.dislikeCount - 1);
                }
            } else if (reactionType === "dislike") {
                if (action === "increment") {
                    updateValues.dislikeCount = blink.dislikeCount + 1;
                } else if (action === "decrement") {
                    updateValues.dislikeCount = Math.max(0, blink.dislikeCount - 1);
                } else if (action === "switch") {
                    updateValues.dislikeCount = blink.dislikeCount + 1;
                    updateValues.likeCount = Math.max(0, blink.likeCount - 1);
                }
            }

            // Mettre à jour le Blink avec les nouvelles valeurs
            await Blinks.update(updateValues, {
                where: { blinkID: postID }
            });

            if (reactionType === "like") {
                await updateBlinkTier(postID);
            }
        } catch (error) {
            console.error('Error updating reaction count:', error);
            throw error;
        }
    }

    /**
     * Gère l'ajout, la suppression ou la mise à jour d'un like sur un Blink.
     */
    async toggleLike(postID, userID) {
        const result = await InteractionsRepository.toggleReaction(postID, userID, "like");

        if (result.created) {
            await this.updateReactionCount(postID, "like", "increment");
        } else if (result.removed) {
            await this.updateReactionCount(postID, "like", "decrement");
        } else if (result.updated) {
            await this.updateReactionCount(postID, "like", "switch");
        }

        return result;
    }

    /**
     * Gère l'ajout, la suppression ou la mise à jour d'un dislike sur un Blink.
     */
    async toggleDislike(postID, userID) {
        const result = await InteractionsRepository.toggleReaction(postID, userID, "dislike");

        if (result.created) {
            await this.updateReactionCount(postID, "dislike", "increment");
        } else if (result.removed) {
            await this.updateReactionCount(postID, "dislike", "decrement");
        } else if (result.updated) {
            await this.updateReactionCount(postID, "dislike", "switch");
        }

        return result;
    }
}

module.exports = new InteractionsService();
