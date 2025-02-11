const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");

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

module.exports = Follows;

