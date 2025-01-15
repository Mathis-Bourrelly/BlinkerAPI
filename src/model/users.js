const { sequelize } = require('../core/postgres'); // Assurez-vous que le chemin est correct

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
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    role: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },

}, {
    timestamps: false,
    createdAt: false,
    updatedAt: false,
});

module.exports = Users;
