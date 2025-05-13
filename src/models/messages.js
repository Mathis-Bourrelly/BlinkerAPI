const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Conversations = require('./conversations');
const Users = require('./users');

const Messages = sequelize.define('Messages', {
    messageID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    conversationID: {
        type: DataTypes.UUID,
        allowNull: true, // Peut être NULL car nous avons encore des messages sans conversationID
        references: {
            model: Conversations,
            key: 'conversationID'
        },
        onDelete: 'CASCADE'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    senderID: {
        type: DataTypes.UUID,
        allowNull: false, // NOT NULL dans la base de données
        references: {
            model: Users,
            key: 'userID'
        }
    },
    receiverID: {
        type: DataTypes.UUID,
        allowNull: false, // NOT NULL dans la base de données
        references: {
            model: Users,
            key: 'userID'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true
});

module.exports = Messages;