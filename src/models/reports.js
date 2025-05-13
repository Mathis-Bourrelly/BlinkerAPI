const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Users = require("./users");
const Blinks = require("./blinks");

const Reports = sequelize.define('Reports', {
    reportID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    reporterID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Users,
            key: 'userID'
        },
        onDelete: 'CASCADE'
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
    reason: {
        type: DataTypes.ENUM('inappropriate', 'spam', 'harassment', 'violence', 'other'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'reviewed', 'rejected', 'action_taken'),
        defaultValue: 'pending',
        allowNull: false
    },
    reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: Users,
            key: 'userID'
        }
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
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

module.exports = Reports;
