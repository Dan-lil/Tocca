"use strict";

const chat = require("../models/chat");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Messages", [
      {
        userId: 1,
        chatId: 1,
        status: "Отправлено",
        text: "Здравствуйте! Я хотел бы узнать больше о ваших услугах по маникюру.",
      },
      {
        userId: 1,
        chatId: 1,
        status: "Прочитано",
        text: "Какие виды маникюра вы предлагаете и какие цены?",
      },
      {
        userId: 2,
        chatId: 1,
        status: "Отправлено",
        text: "Здравствуйте! Спасибо за ваш интерес. Я предлагаю классический, европейский и гель-лак маникюр. Цены начинаются от 1000 рублей.",
      },
      {
        userId: 1,
        chatId: 1,
        status: "Отправлено",
        text: "Отлично! А есть ли у вас свободные окна на следующей неделе?",
      },
      {
        userId: 2,
        chatId: 1,
        status: "Прочитано",
        text: "Да, у меня есть свободные окна в среду и пятницу. Какой день вам удобнее?",
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
    await queryInterface.bulkDelete("Messages", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
