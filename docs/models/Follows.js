const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Follows', {
    fromUserID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userID'
      },
      unique: "unique_follow"
    },
    targetUserID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userID'
      },
      unique: "unique_follow"
    },
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'Follows',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "unique_follow",
        unique: true,
        fields: [
          { name: "fromUserID" },
          { name: "targetUserID" },
        ]
      },
    ]
  });
};
