"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("MasterPortfolios", "portfolioImages", {
      type: Sequelize.TEXT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("MasterPortfolios", "portfolioImages", {
      type: Sequelize.STRING(5000),
    });
  },
};
