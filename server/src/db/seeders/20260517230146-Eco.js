"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Ecos", [
      {
        masterId: 2,
        clientId: 3,
        bookingId: 1,
        rating: 5,
        text: "Отличный мастер! Очень довольна результатом, рекомендую всем!",
      },
      {
        masterId: 6,
        clientId: 4,
        bookingId: 2,
        rating: 4,
        text: "Хороший мастер, но немного задержался с записью.",
      },
      {
        masterId: 7,
        clientId: 5,
        bookingId: 3,
        rating: 5,
        text: "Превосходный мастер! Очень доволен результатом, рекомендую всем!",
      },
      {
        masterId: 8,
        clientId: 6,
        bookingId: 4,
        rating: 4,
        text: "Хороший мастер, но немного задержался с записью.",
      },
      {
        masterId: 9,
        clientId: 7,
        bookingId: 1,
        rating: 5,
        text: "Превосходный мастер! Очень доволен результатом, рекомендую всем!",
      },
      {
        masterId: 2,
        clientId: 8,
        bookingId: 1,
        rating: 4,
        text: "Хороший мастер, но немного задержался с записью.",
      },
      {
        masterId: 9,
        clientId: 7,
        bookingId: 1,
        rating: 5,
        text: "Превосходный мастер! Очень доволен результатом, рекомендую всем!",
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
    await queryInterface.bulkDelete("Ecos", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
