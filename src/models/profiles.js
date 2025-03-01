const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Users = require("./Users");
const Blinks = require("./Blinks");

const Profiles = sequelize.define('Profiles', {
    userID: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
            model: Users,
            key: 'userID'
        },
        onDelete: "CASCADE"
    },
    display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
});

module.exports = Profiles;
