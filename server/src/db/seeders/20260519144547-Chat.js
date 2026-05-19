"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Chats", [
      {
        clientId: 1,
        masterId: 2,
        bookingId: 1,
      },
      {
        clientId: 3,
        masterId: 2,
        bookingId: 2,
      },
      {
        clientId: 4,
        masterId: 6,
        bookingId: 2,
      },
      {
        clientId: 5,
        masterId: 7,
        bookingId: 2,
      },
      {
        clientId: 1,
        masterId: 8,
        bookingId: 3,
      },
    ]);
    /**
     * Add seed commands here.
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
    await queryInterface.bulkDelete("Chats", null, {});
    
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
