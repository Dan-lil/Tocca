"use strict";

const bcrypt = require("bcrypt");

const defaultAvatar = "https://i.pinimg.com/1200x/8e/8e/1f/8e8e1fb952587e99fdb2fd9b09cd2cbb.jpg";

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
          avatar: defaultAvatar,
          role: "admin",
        },
        {
          name: "Оля",
          email: "master@mail.ru",
          password: hashedPassword,
          phone: "88003553535",
          avatar: "/avatar/userId2.jpg",
          role: "master",
        },
        {
          name: "Даня",
          email: "client@mail.ru",
          password: hashedPassword,
          phone: "88003583535",
          avatar: defaultAvatar,
          role: "client",
        },
        {
          name: "Анна",
          email: "anna@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: defaultAvatar,
          role: "client",
        },
        {
          name: "Иван",
          email: "ivan@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: defaultAvatar,
          role: "client",
        },
        {
          name: "Мария",
          email: "maria@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId6.jpg",
          role: "master",
        },
        {
          name: "Петр",
          email: "petr@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId7.jpg",
          role: "master",
        },
        {
          name: "Светлана",
          email: "svetlana@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId8.jpg",
          role: "master",
        },
        {
          name: "Михаил",
          email: "mikhail@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId9.jpg",
          role: "master",
        },
        {
          name: "Елена",
          email: "elena@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId10.jpg",
          role: "master",
        },
        {
          name: "Алексей",
          email: "aleksey@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId11.jpg",
          role: "master",
        },
        {
          name: "Александр",
          email: "aleksandr@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId12.jpg",
          role: "master",
        },
        {
          name: "Дмитрий",
          email: "dmitry@mail.ru",
          password: hashedPassword,
          phone: "88003593535",
          avatar: "/avatar/userId13.jpg",
          role: "master",
        },
      ],
      { returning: ["id"] },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
    await queryInterface.bulkDelete("ProfileMasters", null, {});
    await queryInterface.bulkDelete("MasterPortfolios", null, {});
    await queryInterface.bulkDelete("Services", null, {});
    await queryInterface.bulkDelete("Bookings", null, {});
    await queryInterface.bulkDelete("Chats", null, {});
    await queryInterface.bulkDelete("Ecos", null, {});
  },
};
