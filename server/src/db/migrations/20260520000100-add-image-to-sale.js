"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("Sales");

    if (!table.image) {
      await queryInterface.addColumn("Sales", "image", {
        type: Sequelize.STRING,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("Sales");

    if (table.image) {
      await queryInterface.removeColumn("Sales", "image");
    }
  },
};
