// src/models/associations.js
const Users = require('./users');
const Profiles = require('./profiles');
const Follows = require('./follows');
const Blinks = require('./blinks');
const BlinkContents = require('./blinkContents');
const Interactions = require('./interactions');
const Conversations = require('./conversations');
const Messages = require('./messages');
const BlinkLifetimes = require('./blinkLifetimes');
const Reports = require('./reports');
const Comments = require('./comments');
const Tags = require('./tags');
const BlinkTags = require('./blinkTags');

// Associer Users et Profiles
Users.hasOne(Profiles, { foreignKey: 'userID', onDelete: 'CASCADE' });
Profiles.belongsTo(Users, { foreignKey: 'userID' });

// Associer Blinks et BlinkContents
Blinks.hasMany(BlinkContents, { foreignKey: 'blinkID', onDelete: 'CASCADE', as: 'contents' });
BlinkContents.belongsTo(Blinks, { foreignKey: 'blinkID' });

// Associer Blinks et Profiles
Blinks.belongsTo(Profiles, { foreignKey: 'userID', as: 'profile' });

Users.hasMany(Follows, { foreignKey: "fromUserID", onDelete: "CASCADE" });
Follows.belongsTo(Users, { foreignKey: "fromUserID" });

Users.hasMany(Follows, { foreignKey: "targetUserID", onDelete: "CASCADE" });
Follows.belongsTo(Users, { foreignKey: "targetUserID" });

// Association pour les likes
Users.belongsToMany(Blinks, {
    through: {
        model: Interactions,
        scope: { reactionType: 'like' },
        attributes: ['reactionType']
    },
    foreignKey: 'userID',
    as: 'likedBlinks'
});

Blinks.belongsToMany(Users, {
    through: {
        model: Interactions,
        scope: { reactionType: 'like' },
        attributes: ['reactionType']
    },
    foreignKey: 'postID',
    as: 'likedByUsers'
});

// Association pour les dislikes
Users.belongsToMany(Blinks, {
    through: {
        model: Interactions,
        scope: { reactionType: 'dislike' },
        attributes: ['reactionType']
    },
    foreignKey: 'userID',
    as: 'dislikedBlinks'
});

Blinks.belongsToMany(Users, {
    through: {
        model: Interactions,
        scope: { reactionType: 'dislike' },
        attributes: ['reactionType']
    },
    foreignKey: 'postID',
    as: 'dislikedByUsers'
});

// Associer Users et BlinkLifetimes
Users.hasMany(BlinkLifetimes, { foreignKey: 'userID', onDelete: 'CASCADE' });
BlinkLifetimes.belongsTo(Users, { foreignKey: 'userID' });

// Associations pour les conversations et messages
Messages.belongsTo(Conversations, { foreignKey: 'conversationID' });
Conversations.hasMany(Messages, { foreignKey: 'conversationID', onDelete: 'CASCADE' });

// Association entre Messages et Users pour le champ senderID
Messages.belongsTo(Users, { foreignKey: 'senderID', as: 'sender' });
Users.hasMany(Messages, { foreignKey: 'senderID', as: 'sentMessages' });

// Associations pour les signalements
Users.hasMany(Reports, { foreignKey: 'reporterID', as: 'reportsMade' });
Reports.belongsTo(Users, { foreignKey: 'reporterID', as: 'reporter' });

Users.hasMany(Reports, { foreignKey: 'reviewedBy', as: 'reportsReviewed' });
Reports.belongsTo(Users, { foreignKey: 'reviewedBy', as: 'reviewer' });

Blinks.hasMany(Reports, { foreignKey: 'blinkID', as: 'reports' });
Reports.belongsTo(Blinks, { foreignKey: 'blinkID' });

// Associations pour les commentaires
Blinks.hasMany(Comments, { foreignKey: 'blinkID', as: 'comments', onDelete: 'CASCADE' });
Comments.belongsTo(Blinks, { foreignKey: 'blinkID', as: 'blink' });

Users.hasMany(Comments, { foreignKey: 'userID', as: 'comments', onDelete: 'CASCADE' });
Comments.belongsTo(Users, { foreignKey: 'userID', as: 'user' });

// Associations pour les tags
Blinks.belongsToMany(Tags, {
    through: BlinkTags,
    foreignKey: 'blinkID',
    otherKey: 'tagID',
    as: 'tags'
});

Tags.belongsToMany(Blinks, {
    through: BlinkTags,
    foreignKey: 'tagID',
    otherKey: 'blinkID',
    as: 'blinks'
});

// Associations directes pour BlinkTags
BlinkTags.belongsTo(Blinks, { foreignKey: 'blinkID', as: 'blink' });
BlinkTags.belongsTo(Tags, { foreignKey: 'tagID', as: 'tag' });

Blinks.hasMany(BlinkTags, { foreignKey: 'blinkID', as: 'blinkTags', onDelete: 'CASCADE' });
Tags.hasMany(BlinkTags, { foreignKey: 'tagID', as: 'blinkTags', onDelete: 'CASCADE' });

// Exporter les modèles avec leurs associations
module.exports = {
    Users,
    Profiles,
    Follows,
    Blinks,
    BlinkContents,
    Interactions,
    Conversations,
    Messages,
    BlinkLifetimes,
    Reports,
    Comments,
    Tags,
    BlinkTags
};
