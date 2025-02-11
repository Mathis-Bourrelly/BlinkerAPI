const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Users = require("./Users");

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
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
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

// Associer `Profiles` à `Users`
Users.hasOne(Profiles, { foreignKey: "userID", onDelete: "CASCADE" });
Profiles.belongsTo(Users, { foreignKey: "userID" });

module.exports = Profiles;
