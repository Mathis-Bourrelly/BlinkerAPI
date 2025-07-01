const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Blinks = require("./blinks");

const BlinkContents = sequelize.define('BlinkContents', {
    contentID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    blinkID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Blinks,
            key: 'blinkID'
        },
        onDelete: 'CASCADE'
    },
    contentType: {
        type: DataTypes.ENUM('text', 'image', 'video'),
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    position: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false
});

module.exports = BlinkContents;