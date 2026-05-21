"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Categories", [
      {
        title: "Ногти",
        titleEn: "Nails",
        photo: "haircut.jpg",
      },
      {
        title: "Косметология",
        titleEn: "Cosmetology",
        photo: "beard_trim.jpg",
      },
      {
        title: "Волосы",
        titleEn: "Hair",
        photo: "beard_trim.jpg",
      },
      {
        title: "Массаж",
        titleEn: "Massage",
        photo: "beard_trim.jpg",
      },
      {
        title: "Макияж",
        titleEn: "Makeup",
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
