"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Sales", [
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 2,
        finalPrice: 3750,
        discount: 25,
        comment: "Антицеллюлитный массаж со скидкой 25%",
        image: "/акции/anticellulite-massage-25.png",
        date: new Date("2026-06-30T21:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 1,
        finalPrice: 3150,
        discount: 10,
        comment: "Скидка 10% на следующий маникюр",
        image: "/акции/bring-friend-10-v2.png",
        date: new Date("2026-06-15T21:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 5,
        finalPrice: 2975,
        discount: 15,
        comment: "Минус 15% на макияж для нового клиента",
        image: "/акции/brows-lashes-15.png",
        date: new Date("2026-06-20T21:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 3,
        finalPrice: 3000,
        discount: 0,
        comment: "Укладка в подарок при записи на образ",
        image: "/акции/haircut-styling-gift.png",
        date: new Date("2026-06-25T21:00:00"),
      },
      {
        masterId: 2,
        bookingId: 1,
        serviziId: 1,
        finalPrice: 2800,
        discount: 20,
        comment: "Скидка 20% на первое посещение ногтевого сервиса",
        image: "/акции/manicure-discount-20 (1).png",
        date: new Date("2026-06-10T21:00:00"),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Sales", null, {});
  },
};
