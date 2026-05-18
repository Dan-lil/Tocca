"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Servizis", [
      {
        masterId: 2,
        title: "Ногти",
        description: "Маникюр и аккуратный уход за ногтями",
        price: 10000.0,
        duration: 60.0,
        categoryId: 1,
        isActive: true,
        image: "/услуги на главной/ногти9.jpg",
      },
      {
        masterId: 2,
        title: "Массаж",
        description: "Расслабляющий массаж для лица и тела",
        price: 5000.0,
        duration: 90.0,
        categoryId: 4,
        isActive: true,
        image: "/услуги на главной/массаж8.jpg",
      },
      {
        masterId: 2,
        title: "Волосы",
        description: "Укладка и образ для любого события",
        price: 3000.0,
        duration: 60.0,
        categoryId: 5,
        isActive: true,
        image: "/услуги на главной/прическа2.jpg",
      },
      {
        masterId: 2,
        title: "Косметология",
        description: "Уход за кожей лица и свежий тон",
        price: 4000.0,
        duration: 60.0,
        categoryId: 4,
        isActive: true,
        image: "/услуги на главной/косметология11.jpg",
      },
      {
        masterId: 2,
        title: "Макияж",
        description: "Легкий и выразительный макияж под образ",
        price: 3500.0,
        duration: 60.0,
        categoryId: 1,
        isActive: true,
        image: "/услуги на главной/макияж1.jpg",
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Servizis", null, {});
  },
};
