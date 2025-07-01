const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");

const BlinkTags = sequelize.define('BlinkTags', {
    blinkTagID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    blinkID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Blinks',
            key: 'blinkID'
        },
        onDelete: 'CASCADE'
    },
    tagID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Tags',
            key: 'tagID'
        },
        onDelete: 'CASCADE'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['blinkID', 'tagID']
        },
        {
            fields: ['tagID', 'createdAt']
        },
        {
            fields: ['blinkID']
        }
    ]
});

module.exports = BlinkTags;
