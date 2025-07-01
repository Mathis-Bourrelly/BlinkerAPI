const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");

const Conversations = sequelize.define('Conversations', {
    conversationID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    participants: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        validate: {
            minParticipants(value) {
                if (value.length < 2) {
                    throw new Error('Une conversation doit avoir au moins 2 participants');
                }
            }
        }
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

module.exports = Conversations;
