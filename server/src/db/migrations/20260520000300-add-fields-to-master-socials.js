"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("MasterSocials");

    if (!table.contact) {
      await queryInterface.addColumn("MasterSocials", "contact", {
        type: Sequelize.STRING,
      });
    }

    if (!table.network) {
      await queryInterface.addColumn("MasterSocials", "network", {
        type: Sequelize.STRING,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("MasterSocials");

    if (table.network) {
      await queryInterface.removeColumn("MasterSocials", "network");
    }

    if (table.contact) {
      await queryInterface.removeColumn("MasterSocials", "contact");
    }
  },
};
