const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Profiles', {
    userID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'userID'
      }
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false
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
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'Profiles',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Profiles_pkey",
        unique: true,
        fields: [
          { name: "userID" },
        ]
      },
    ]
  });
};
