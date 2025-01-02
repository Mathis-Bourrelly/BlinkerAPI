const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('User', {
        userID: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
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
            unique: true,
        },
        role: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'user', // Valeur par défaut pour les rôles
        },
    }, {
        timestamps: false,
        tableName: 'Users', // Nom explicite de la table
    });
};
