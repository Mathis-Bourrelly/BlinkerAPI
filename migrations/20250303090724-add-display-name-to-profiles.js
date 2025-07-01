module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Profiles', 'display_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: "Utilisateur"
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Profiles', 'display_name');
  }
};
