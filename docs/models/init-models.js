var DataTypes = require("sequelize").DataTypes;
var _BlinkContents = require("./BlinkContents");
var _Blinks = require("./Blinks");
var _Follows = require("./Follows");
var _Profiles = require("./Profiles");
var _SequelizeMeta = require("./SequelizeMeta");
var _Users = require("./Users");

function initModels(sequelize) {
  var BlinkContents = _BlinkContents(sequelize, DataTypes);
  var Blinks = _Blinks(sequelize, DataTypes);
  var Follows = _Follows(sequelize, DataTypes);
  var Profiles = _Profiles(sequelize, DataTypes);
  var SequelizeMeta = _SequelizeMeta(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);

  BlinkContents.belongsTo(Blinks, { as: "blink", foreignKey: "blinkID"});
  Blinks.hasMany(BlinkContents, { as: "BlinkContents", foreignKey: "blinkID"});
  Blinks.belongsTo(Users, { as: "user", foreignKey: "userID"});
  Users.hasMany(Blinks, { as: "Blinks", foreignKey: "userID"});
  Follows.belongsTo(Users, { as: "fromUser", foreignKey: "fromUserID"});
  Users.hasMany(Follows, { as: "Follows", foreignKey: "fromUserID"});
  Follows.belongsTo(Users, { as: "targetUser", foreignKey: "targetUserID"});
  Users.hasMany(Follows, { as: "targetUser_Follows", foreignKey: "targetUserID"});
  Profiles.belongsTo(Users, { as: "user", foreignKey: "userID"});
  Users.hasOne(Profiles, { as: "Profile", foreignKey: "userID"});

  return {
    BlinkContents,
    Blinks,
    Follows,
    Profiles,
    SequelizeMeta,
    Users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
