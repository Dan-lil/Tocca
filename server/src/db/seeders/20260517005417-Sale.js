"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Sales", [
      {
        masterId: 13,
        bookingId: 1,
        serviziId: 12,
        finalPrice: 3750,
        discount: 25,
        comment: "Антицеллюлитный массаж со скидкой 25%",
        image: "/promotions/anticellulite-massage-13.WebP",
        date: new Date("2026-06-30T21:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 1,
        finalPrice: 3150,
        discount: 10,
        comment: "Скидка 10% на следующий маникюр",
        image: "/promotions/bring-friend-2.WebP",
        date: new Date("2026-06-15T21:00:00"),
      },
      {
        masterId: 10,
        bookingId: 1,
        serviziId: 7,
        finalPrice: 2975,
        discount: 15,
        comment: "Минус 15% на макияж для нового клиента",
        image: "/promotions/brows-lashes-10.WebP",
        date: new Date("2026-06-20T21:00:00"),
      },
      {
        masterId: 11,
        bookingId: 1,
        serviziId: 4,
        finalPrice: 3000,
        discount: 0,
        comment: "Укладка в подарок при записи на образ",
        image: "/promotions/haircut-styling-gift-11.WebP",
        date: new Date("2026-06-25T21:00:00"),
      },
      {
        masterId: 7,
        bookingId: 1,
        serviziId: 9,
        finalPrice: 2800,
        discount: 20,
        comment: "Скидка 20% на первое посещение ногтевого сервиса",
        image: "/promotions/manicure-discount-7.WebP",
        date: new Date("2026-06-10T21:00:00"),
      },
      {
        masterId: 8,
        bookingId: 1,
        serviziId: 6,
        finalPrice: 3000,
        discount: 15,
        comment: "Скидка 15% на чистку лица",
        image: "/promotions/face-cleansing-8.WebP",
        date: new Date("2026-06-10T21:00:00"),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Sales", null, {});
  },
};
