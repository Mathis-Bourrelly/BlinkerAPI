const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");

const Users = sequelize.define('Users', {
    userID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "user"
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
});

module.exports = Users;
