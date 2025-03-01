// src/models/associations.js
const Users = require('./users');
const Profiles = require('./profiles');
const Follows = require('./follows');
const Blinks = require('./blinks');
const BlinkContents = require('./blinkContents');
const Interactions = require('./interactions');

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

module.exports = {};
