"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "telegramId", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "telegramUsername", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "authProvider", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "email",
    });

    await queryInterface.addIndex("Users", ["telegramId"], {
      unique: true,
      name: "users_telegram_id_unique_idx",
    });

    await queryInterface.addIndex("Users", ["telegramUsername"], {
      name: "users_telegram_username_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Users", "users_telegram_username_idx");
    await queryInterface.removeIndex("Users", "users_telegram_id_unique_idx");
    await queryInterface.removeColumn("Users", "authProvider");
    await queryInterface.removeColumn("Users", "telegramUsername");
    await queryInterface.removeColumn("Users", "telegramId");
  },
};
