const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Users = require("./Users");

const Follows = sequelize.define('Follows', {
    fromUserID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'userID'
        }
    },
    targetUserID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'userID'
        }
    }
}, {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
});
Users.hasMany(Follows, { foreignKey: "fromUserID", onDelete: "CASCADE" });
Follows.belongsTo(Users, { foreignKey: "fromUserID" });

Users.hasMany(Follows, { foreignKey: "targetUserID", onDelete: "CASCADE" });
Follows.belongsTo(Users, { foreignKey: "targetUserID" });

module.exports = Follows;

