"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Categories", [
      {
        title: "Nails & NailsArt",
        photo: "haircut.jpg",
      },
      {
        title: "Cosmetology",
        photo: "beard_trim.jpg",
      },
      {
        title: "Heaircut & HairColor",
        photo: "beard_trim.jpg",
      },
      {
        title: "Massage & SPA",
        photo: "beard_trim.jpg",
      },
      {
        title: "Makeup & Brow",
        photo: "beard_trim.jpg",
      },
    ]);
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Categories", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
