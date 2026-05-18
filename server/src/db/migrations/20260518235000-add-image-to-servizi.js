"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Servizis");

    if (!table.image) {
      await queryInterface.addColumn("Servizis", "image", {
        type: Sequelize.STRING,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Servizis");

    if (table.image) {
      await queryInterface.removeColumn("Servizis", "image");
    }
  },
};
