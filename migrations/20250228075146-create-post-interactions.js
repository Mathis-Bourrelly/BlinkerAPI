module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Interactions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      postID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Blinks",
          key: "blinkID"
        },
        onDelete: "CASCADE"
      },
      userID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "userID"
        },
        onDelete: "CASCADE"
      },
      reactionType: {
        type: Sequelize.ENUM("like", "dislike"),
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()")
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()")
      }
    });

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Interactions");
  }
};