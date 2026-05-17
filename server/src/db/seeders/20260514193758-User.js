"use strict";

const bcrypt = require("bcrypt");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    await queryInterface.bulkInsert(
      "Users",
      [
        {
          name: "Admin_Asya",
          email: "admin@mail.ru",
          password: hashedPassword,
          phone: "88005553535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "admin",
        },
        {
          name: "Оля",
          email: "master@mail.ru",
          password: hashedPassword,
          phone: "88003553535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Даня",
          email: "client@mail.ru",
          password: hashedPassword,
          phone: "88003583535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "client",
        },
        {
          name: "Анна",
          email: "anna@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "client",
        },
        {
          name: "Иван",
          email: "ivan@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "client",
        },
        {
          name: "Мария",
          email: "maria@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Петр",
          email: "petr@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Светлана",
          email: "svetlana@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Михаил",
          email: "mikhail@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Елена",
          email: "elena@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Алексей",
          email: "aleksey@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Александра",
          email: "aleksandra@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
        {
          name: "Дмитрий",
          email: "dmitry@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar:
            "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg",
          role: "master",
        },
      ],
      { returning: ["id"] },
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
    await queryInterface.bulkDelete("Users", null, {});
    await queryInterface.bulkDelete("ProfileMasters", null, {});
    await queryInterface.bulkDelete("MasterPortfolios", null, {});
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
