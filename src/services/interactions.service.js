const InteractionsRepository = require("../repository/interactions.repository");
const Blinks = require("../models/blinks");
const { Op } = require("sequelize");
const { updateBlinkTier } = require("./blinks.service");

class InteractionsService {
    /**
     * Met à jour le compteur de likes/dislikes sur un Blink en fonction de l'action effectuée.
     */
    async updateReactionCount(postID, reactionType, action) {
        const updateValues = {};

        if (reactionType === "like") {
            updateValues.likeCount = action === "increment" ? 1 : -1;
            if (action === "switch") {
                updateValues.dislikeCount = -1;
            }
        } else if (reactionType === "dislike") {
            updateValues.dislikeCount = action === "increment" ? 1 : -1;
            if (action === "switch") {
                updateValues.likeCount = -1;
            }
        }

        const test = await Blinks.increment(updateValues, {
            where: {
                blinkID: postID,
                [reactionType === "like" ? "likeCount" : "dislikeCount"]: { [Op.gt]: 0 }
            }
        });
        console.log('test', test);
        if (reactionType === "like") {
            await updateBlinkTier(postID);
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
