const { DataTypes } = require("sequelize");
const { sequelize } = require("../core/postgres");
const Blinks = require("./blinks");
const Users = require("./users");

const Interactions = sequelize.define("Interactions", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    postID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Blinks,
            key: "blinkID"
        },
        onDelete: "CASCADE"
    },
    userID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Users,
            key: "userID"
        },
        onDelete: "CASCADE"
    },
    reactionType: {
        type: DataTypes.ENUM("like", "dislike"),
        allowNull: false
    }
}, {
    timestamps: true,
    indexes: [
        { unique: true, fields: ["postID", "userID"] }
    ]
});

module.exports = Interactions;
