"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Sales", [
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 1,
        discount: 10,
        date: new Date("2024-07-01T11:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 2,
        finalPrice: 1500,
        discount: 10,
        comment: "Отличная работа, рекомендую!",
        date: new Date("2024-07-01T11:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 1,
        finalPrice: 1500,
        discount: 10,
        comment: "Отличная работа, рекомендую!",
        date: new Date("2024-07-01T11:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 2,
        finalPrice: 1500,
        discount: 10,
        comment: "Отличная работа, рекомендую!",
        date: new Date("2024-07-01T11:00:00"),
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
    await queryInterface.bulkDelete("Sales", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
