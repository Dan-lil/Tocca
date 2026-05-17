"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Bookings",
      [
        {
          clientId: 1,
          masterId: 2,
          serviziId: 1,
          date: new Date("2024-07-01"),
          startTime: new Date("2024-07-01T10:00:00"),
          endTime: new Date("2024-07-01T11:00:00"),
          status: "Подтверждено",
          clientComment: "Очень жду эту процедуру!",
        },
        {
          clientId: 1,
          masterId: 2,
          serviziId: 2,
          date: new Date("2024-07-02"),
          startTime: new Date("2024-07-02T14:00:00"),
          endTime: new Date("2024-07-02T15:30:00"),
          status: "Отменено",
          clientComment: "К сожалению, не смогу прийти в этот день.",
          cancelReason: "Личные обстоятельства",
        },
        {
          clientId: 1,
          masterId: 2,
          serviziId: 1,
          date: new Date("2024-07-03"),
          startTime: new Date("2024-07-03T09:00:00"),
          endTime: new Date("2024-07-03T10:00:00"),
          status: "Завершена",
          clientComment: "Было круто.",
        },
        {
          clientId: 1,
          masterId: 2,
          serviziId: 2,
          date: new Date("2024-07-04"),
          startTime: new Date("2024-07-04T11:00:00"),
          endTime: new Date("2024-07-04T12:00:00"),
          status: "Ожидает подтверждения",
          clientComment: "Хочу попробовать новую процедуру.",
        },
      ],
      {},
    );

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
    await queryInterface.bulkDelete("Bookings", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
