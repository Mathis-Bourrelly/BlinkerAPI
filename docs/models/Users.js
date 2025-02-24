const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Users', {
    userID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "Users_email_key99"
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
    sequelize,
    tableName: 'Users',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Users_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "Users_pkey",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
};
