"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Servizis", [
      {
        masterId: 2,
        title: "Наращивание ногтей гель-лаком",
        description:
          "Супер быстрое наращивание ногтей гель-лаком, с идеальной формой и дизайном на ваш выбор. Профессиональный мастер с опытом работы более 9 лет гарантирует высокое качество и долговечность результата. Подход к каждому клиенту и исполнение любых идей в кратчайшие сроки! Плюс все стерильно!",
        price: 10000.0,
        duration: 60.0,
        categoryId: 1,
        isActive: true,
      },
      {
        masterId: 2,
        title: "Массаж лица и шеи и головы и плеч и рук и спины и ног",
        description:
          "Высококачественный массаж лица, шеи, головы, плеч, рук, спины и ног от профессионального мастера с опытом работы более 9 лет. Этот комплексный массаж поможет снять напряжение, улучшить кровообращение и восстановить баланс в вашем теле. Подход к каждому клиенту и исполнение любых идей в кратчайшие сроки! Плюс все стерильно!",
        price: 5000.0,
        duration: 90.0,
        categoryId: 4,
        isActive: true,
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
    await queryInterface.bulkDelete("Servizis", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
