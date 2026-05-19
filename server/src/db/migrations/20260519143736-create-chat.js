"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Chats", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      clientId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        allowNull: false,
      },
      masterId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        allowNull: false,
      },
      bookingId: {
        type: Sequelize.INTEGER,
        references: { model: "Bookings", key: "id" },
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Chats");
  },
};
