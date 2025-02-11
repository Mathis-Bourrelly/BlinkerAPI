'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Follows', {
      fromUserID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'userID'
        },
        onDelete: 'CASCADE'
      },
      targetUserID: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'userID'
        },
        onDelete: 'CASCADE'
      }
    });

    await queryInterface.addConstraint('Follows', {
      fields: ['fromUserID', 'targetUserID'],
      type: 'unique',
      name: 'unique_follow'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Follows');
  }
};
