"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Shadules",
      [
        {
          masterId: 2,
          dayOdWeek: 1,
          startTime: new Date("2024-07-01T09:00:00"),
          endTime: new Date("2024-07-01T18:00:00"),
          isWorkingDay: true,
        },
        {
          masterId: 2,
          dayOdWeek: 2,
          startTime: new Date("2024-07-02T09:00:00"),
          endTime: new Date("2024-07-02T18:00:00"),
          isWorkingDay: true,
        },
        {
          masterId: 2,
          dayOdWeek: 3,
          startTime: new Date("2024-07-03T09:00:00"),
          endTime: new Date("2024-07-03T18:00:00"),
          isWorkingDay: true,
        },
        {
          masterId: 2,
          dayOdWeek: 4,
          startTime: new Date("2024-07-04T09:00:00"),
          endTime: new Date("2024-07-04T18:00:00"),
          isWorkingDay: true,
        },
        {
          masterId: 2,
          dayOdWeek: 5,
          startTime: new Date("2024-07-05T09:00:00"),
          endTime: new Date("2024-07-05T18:00:00"),
          isWorkingDay: true,
        },
        {
          masterId: 2,
          dayOdWeek: 6,
          startTime: new Date("2024-07-06T09:00:00"),
          endTime: new Date("2024-07-06T18:00:00"),
          isWorkingDay: false,
        },
        {
          masterId: 2,
          dayOdWeek: 0,
          startTime: new Date("2024-07-07T09:00:00"),
          endTime: new Date("2024-07-07T18:00:00"),
          isWorkingDay: false,
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
    await queryInterface.bulkDelete("Shadules", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
