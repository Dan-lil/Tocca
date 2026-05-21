"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "Chats" ALTER COLUMN "bookingId" DROP NOT NULL;',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM "Chats" WHERE "bookingId" IS NULL;');
    await queryInterface.sequelize.query(
      'ALTER TABLE "Chats" ALTER COLUMN "bookingId" SET NOT NULL;',
    );
  },
};
