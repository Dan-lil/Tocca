"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("MasterSocials", [
      {
        userId: 2,
        contact: "@Oliver_Brave",
        network: "telegram",
      },
      {
        userId: 6,
        contact: "@Emily_Swift",
        network: "telegram",
      },
      {
        userId: 7,
        contact: "@Sophia_Grace",
        network: "telegram",
      },
      {
        userId: 8,
        contact: "@Liam_Strong",
        network: "telegram",
      },
      {
        userId: 9,
        contact: "@Ava_Bold",
        network: "telegram",
      },
      {
        userId: 10,
        contact: "@Noah_Fierce",
        network: "telegram",
      },
      {
        userId: 11,
        contact: "@Isabella_Swift",
        network: "telegram",
      },
      {
        userId: 12,
        contact: "@Mason_Brave",
        network: "telegram",
      },
      {
        userId: 13,
        contact: "@Mia_Strong",
        network: "telegram",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("MasterSocials", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
