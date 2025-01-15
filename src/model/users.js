const { DataTypes } = require('sequelize');
<<<<<<< Updated upstream
const { sequelize } = require('../core/postgres');

const users = sequelize.define('Users', {
=======
const { sequelize } = require('../core/postgres'); // Assurez-vous que le chemin est correct

const Users = sequelize.define('Users', {
>>>>>>> Stashed changes
    userID: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
<<<<<<< Updated upstream
        primaryKey: true
=======
        primaryKey: true,
>>>>>>> Stashed changes
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
<<<<<<< Updated upstream
        unique: true
=======
        unique: true,
>>>>>>> Stashed changes
    },
    role: {
        type: DataTypes.STRING(50),
        allowNull: false,
<<<<<<< Updated upstream
    },

}, {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
});

module.exports = users;
=======
        defaultValue: 'user',
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    timestamps: false,
});

module.exports = Users; // Assurez-vous d'exporter correctement le modèle
>>>>>>> Stashed changes
