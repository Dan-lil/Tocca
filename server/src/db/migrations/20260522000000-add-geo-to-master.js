"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("ProfileMasters", "latitude", {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: "Широта локации мастера",
    });
    await queryInterface.addColumn("ProfileMasters", "longitude", {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: "Долгота локации мастера",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("ProfileMasters", "latitude");
    await queryInterface.removeColumn("ProfileMasters", "longitude");
  },
};
