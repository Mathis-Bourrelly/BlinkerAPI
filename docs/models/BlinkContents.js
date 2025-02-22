const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('BlinkContents', {
    contentID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    blinkID: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Blinks',
        key: 'blinkID'
      }
    },
    contentType: {
      type: DataTypes.ENUM("text","image","video"),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'BlinkContents',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "BlinkContents_pkey",
        unique: true,
        fields: [
          { name: "contentID" },
        ]
      },
    ]
  });
};
