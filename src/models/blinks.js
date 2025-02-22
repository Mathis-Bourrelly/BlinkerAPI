const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");

const Blinks = sequelize.define('Blinks', {
    blinkID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    userID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'userID'
        },
        onDelete: 'CASCADE'
    },
    likeCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    commentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    shareCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

module.exports = Blinks;
