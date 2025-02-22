const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Blinks', {
    blinkID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    userID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userID'
      }
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    shareCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'Blinks',
    schema: 'public',
    timestamps: true,
    indexes: [
      {
        name: "Blinks_pkey",
        unique: true,
        fields: [
          { name: "blinkID" },
        ]
      },
    ]
  });
};
