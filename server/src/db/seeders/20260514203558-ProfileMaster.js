"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("ProfileMasters", [
      {
        userId: 2,
        title: "Супер Мастер ЕКБ",
        description:
          "Проффессиональный мастер с опытом работы более 9 лет,самые выгодные цены и лучшие работы в городе.Подход к каждому клиенту и исполнение любых идей в кротчайщие сроки!Плюс все стирильно!",
        city: "Екатеринбург",
        address: "Улица Длинная,дом 10",
        experience: 9.2,
        category: "Nails & NailsArt",
        rating: 4.8,
      },
      //
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
    await queryInterface.bulkDelete("ProfileMasters", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
