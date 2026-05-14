"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("MasterPortfolios", [
      {
        userId: 2,
        portfolioImages:
          "https://i.pinimg.com/1200x/f7/ba/f2/f7baf2f8b1ae4b65425adce7ba511b98.jpg",
        text: "Супер проф работа",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("MasterPortfolios", null, {});
  },
};
