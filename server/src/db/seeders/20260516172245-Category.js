"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Categories", [
      {
        title: "Ногти",
        photo: "haircut.jpg",
      },
      {
        title: "Косметология",
        photo: "beard_trim.jpg",
      },
      {
        title: "Волосы",
        photo: "beard_trim.jpg",
      },
      {
        title: "Массаж",
        photo: "beard_trim.jpg",
      },
      {
        title: "Макияж",
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
