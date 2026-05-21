"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("ProfileMasters", [
      {
        userId: 2,
        title: "Нейл-мастер",
        description:
          "Проффессиональный мастер с опытом работы более 9 лет,самые выгодные цены и лучшие работы в городе.Подход к каждому клиенту и исполнение любых идей в кротчайщие сроки!Плюс все стирильно!",
        city: "Екатеринбург",
        address: "Улица Длинная,дом 10",
        experience: 9.2,
        category: "Nails & NailsArt",
        rating: 4.8,
      },
      {
        userId: 6,
        title: "Мастер маникюра",
        description:
          "Опыт работы 5 лет. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 5",
        experience: 5.0,
        category: "Nails & NailsArt",
        rating: 4.5,
      },
      {
        userId: 7,
        title: "Мастер педикюра",
        description:
          "Опыт работы 7 лет. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 7",
        experience: 7.0,
        category: "Nails & NailsArt",
        rating: 4.7,
      },
      {
        userId: 8,
        title: "Косметолог-эстетист",
        description:
          "Опыт работы 9 лет.Есть высшее медицинское образование. Специализируюсь на уходах за лицом и телом, а также на инъекционных процедурах.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 8",
        experience: 9.0,
        category: "Cosmetology",
        rating: 4.9,
      },
      {
        userId: 9,
        title: "Косметолог",
        description:
          "Опыт работы 10 лет. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 9",
        experience: 10.0,
        category: "Cosmetology",
        rating: 4.8,
      },
      {
        userId: 10,
        title: "Визажист",
        description:
          "Опыт работы 8 лет. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 10",
        experience: 8.0,
        category: "Cosmetology",
        rating: 4.6,
      },
      {
        userId: 11,
        title: "Стилист по волосам",
        description:
          "Опыт работы 6 лет. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 11",
        experience: 6.0,
        category: "Heaircut & HairColor",
        rating: 4.5,
      },
      {
        userId: 12,
        title: "Колорист-стилист",
        description:
          "Опыт работы 4 года. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 12",
        experience: 4.0,
        category: "Heaircut & HairColor",
        rating: 4.3,
      },
      {
        userId: 13,
        title: "Массажист SPA",
        description:
          "Опыт работы 3 года. Специализируюсь на создании уникальных дизайнов для ногтей.",
        city: "Екатеринбург",
        address: "Улица Короткая,дом 13",
        experience: 3.0,
        category: "Massage & SPA",
        rating: 4.2,
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
    await queryInterface.bulkDelete("ProfileMasters", null, {});

    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
