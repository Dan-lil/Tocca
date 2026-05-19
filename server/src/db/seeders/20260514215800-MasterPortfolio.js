"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("MasterPortfolios", [
      {
        userId: 2,
        portfolioImages:
          "https://i.pinimg.com/1200x/f7/ba/f2/f7baf2f8b1ae4b65425adce7ba511b98.jpg, https://i.pinimg.com/736x/f1/1d/2d/f11d2de604fcd0e390107ceccb30e218.jpg, https://i.pinimg.com/1200x/e4/5c/04/e45c04b93a56ab88cb07bbb891c2c876.jpg, https://i.pinimg.com/736x/1d/c8/0f/1dc80f739240ec526ba327d8c7243371.jpg",
        text: "Супер проф работа",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("MasterPortfolios", null, {});
  },
};
