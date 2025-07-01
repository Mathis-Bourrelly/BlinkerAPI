const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");
const Users = require("./users");
const Blinks = require("./blinks");

const Comments = sequelize.define('Comments', {
    commentID: {
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
    userID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Users,
            key: 'userID'
        },
        onDelete: 'CASCADE'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le contenu du commentaire ne peut pas être vide'
            },
            len: {
                args: [1, 1000],
                msg: 'Le commentaire doit contenir entre 1 et 1000 caractères'
            }
        }
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['blinkID', 'userID'],
            name: 'unique_comment_per_user_per_blink'
        },
        {
            fields: ['blinkID'],
            name: 'idx_comments_blink_id'
        },
        {
            fields: ['userID'],
            name: 'idx_comments_user_id'
        }
    ]
});

module.exports = Comments;
