module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Blinks', 'dislikeCount', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Blinks', 'dislikeCount');
  }
};
