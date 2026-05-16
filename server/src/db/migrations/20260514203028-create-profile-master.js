"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ProfileMasters", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "Users", key: "id" },
        onDelete: "cascade",
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      city: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
      },
      experience: {
        type: Sequelize.FLOAT,
      },
      category: {
        type: Sequelize.STRING,
      },
      rating: {
        type: Sequelize.FLOAT,
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
    await queryInterface.dropTable("ProfileMasters");
  },
};
