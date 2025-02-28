const PostInteractions = require("../models/interactions");
const ErrorCodes = require("../../constants/errorCodes");

class InteractionRepository {
    /**
     * Ajoute ou met à jour une réaction (like/dislike) d'un utilisateur sur un post.
     */
    async toggleReaction(postID, userID, reactionType) {
        const existingReaction = await PostInteractions.findOne({ where: { postID, userID } });

        if (existingReaction) {
            if (existingReaction.reactionType === reactionType) {
                await existingReaction.destroy(); // Supprime le like/dislike si on appuie à nouveau
                return { removed: true };
            } else {
                existingReaction.reactionType = reactionType;
                await existingReaction.save(); // Change le like en dislike et vice-versa
                return { updated: true };
            }
        }

        await PostInteractions.create({ postID, userID, reactionType });
        return { created: true };
    }
}

module.exports = new InteractionRepository();