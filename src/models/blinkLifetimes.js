const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Users = require("./users");

const BlinkLifetimes = sequelize.define('BlinkLifetimes', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userID: {
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
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    lifetime: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'BlinkLifetimes',
    timestamps: false
});

module.exports = BlinkLifetimes;
