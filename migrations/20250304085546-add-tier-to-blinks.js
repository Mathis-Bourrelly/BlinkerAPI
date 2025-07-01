module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Blinks', 'tier', {
      type: Sequelize.ENUM('none', 'bronze', 'silver', 'gold'),
      allowNull: false,
      defaultValue: 'none'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Blinks', 'tier');
  }
};