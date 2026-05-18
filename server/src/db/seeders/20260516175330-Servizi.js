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
        image:
          "https://i.pinimg.com/736x/54/65/20/546520b51435244fbc436bf740e1fb26.jpg",
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
        image:
          "https://i.pinimg.com/736x/0f/88/a6/0f88a6f1559bce9da501c65e43ba8748.jpg",
      },
      {
        masterId: 2,
        title: "Причёска и макияж",
        description:
          "Профессиональная стилистическая консультация с опытным специалистом. Мы поможем вам найти идеальный образ, который подчеркнет ваши лучшие качества и поможет чувствовать себя уверенно.",
        price: 3000.0,
        duration: 60.0,
        categoryId: 5,
        isActive: true,
        image:
          "https://i.pinimg.com/736x/29/50/04/29500482f431b8e14d13347b41c8ac97.jpg",
      },
      {
        masterId: 2,
        title: "Уход за лицом",
        description:
          "Профессиональный уход за лицом от опытного мастера с опытом работы более 9 лет. Этот уход поможет улучшить состояние вашей кожи, увлажнить ее и придать ей здоровый вид. Подход к каждому клиенту и исполнение любых идей в кратчайшие сроки! Плюс все стерильно!",
        price: 4000.0,
        duration: 60.0,
        categoryId: 4,
        isActive: true,
        image:
          "https://i.pinimg.com/736x/22/57/d2/2257d253c418d569229cf6e24f3f183c.jpg",
      },
      {
        masterId: 2,
        title: "Макияж",
        description:
          "Профессиональный макияж от опытного мастера с опытом работы более 9 лет. Этот макияж поможет подчеркнуть ваши лучшие качества и поможет чувствовать себя уверенно. Подход к каждому клиенту и исполнение любых идей в кратчайшие сроки! Плюс все стерильно!",
        price: 3500.0,
        duration: 60.0,
        categoryId: 1,
        isActive: true,
        image:
          "https://i.pinimg.com/1200x/a1/09/e3/a109e38b31379b3ded317b2b8017ebab.jpg",
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
