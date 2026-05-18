"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Servizis", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      masterId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(1000),
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      duration: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Categories", key: "id" },
      },
      isActive: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable("Servizis");
  },
};
