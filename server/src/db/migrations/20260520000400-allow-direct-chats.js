"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Chats", "bookingId", {
      type: Sequelize.INTEGER,
      references: { model: "Bookings", key: "id" },
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Chats", "bookingId", {
      type: Sequelize.INTEGER,
      references: { model: "Bookings", key: "id" },
      allowNull: false,
    });
  },
};
