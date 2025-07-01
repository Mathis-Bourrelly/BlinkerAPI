const { sequelize } = require('../core/postgres');
const { DataTypes } = require("sequelize");

const Tags = sequelize.define('Tags', {
    tagID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [1, 50],
            notEmpty: true,
            // Validation pour s'assurer que le tag ne contient que des caractères alphanumériques et quelques caractères spéciaux
            is: /^[a-zA-Z0-9àáâäçéèêëíìîïñóòôöúùûüýÿ\s\-_#]+$/i
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
    timestamps: true,
    hooks: {
        beforeCreate: (tag) => {
            // Normaliser le nom du tag (trim et lowercase)
            tag.name = tag.name.trim().toLowerCase();
        },
        beforeUpdate: (tag) => {
            // Normaliser le nom du tag (trim et lowercase)
            if (tag.name) {
                tag.name = tag.name.trim().toLowerCase();
            }
        }
    }
});

module.exports = Tags;
