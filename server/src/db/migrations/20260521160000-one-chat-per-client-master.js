"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        WITH ranked_chats AS (
          SELECT
            id,
            "clientId",
            "masterId",
            "bookingId",
            "updatedAt",
            FIRST_VALUE(id) OVER (
              PARTITION BY "clientId", "masterId"
              ORDER BY "updatedAt" DESC, id DESC
            ) AS keep_id,
            FIRST_VALUE("bookingId") OVER (
              PARTITION BY "clientId", "masterId"
              ORDER BY ("bookingId" IS NULL), "updatedAt" DESC, id DESC
            ) AS keep_booking_id
          FROM "Chats"
        ),
        duplicate_chats AS (
          SELECT id, keep_id
          FROM ranked_chats
          WHERE id <> keep_id
        ),
        booking_context AS (
          SELECT DISTINCT keep_id, keep_booking_id
          FROM ranked_chats
        )
        UPDATE "ChatMessages" AS message
        SET "chatId" = duplicate.keep_id
        FROM duplicate_chats AS duplicate
        WHERE message."chatId" = duplicate.id;

        WITH ranked_chats AS (
          SELECT
            id,
            FIRST_VALUE(id) OVER (
              PARTITION BY "clientId", "masterId"
              ORDER BY "updatedAt" DESC, id DESC
            ) AS keep_id,
            FIRST_VALUE("bookingId") OVER (
              PARTITION BY "clientId", "masterId"
              ORDER BY ("bookingId" IS NULL), "updatedAt" DESC, id DESC
            ) AS keep_booking_id
          FROM "Chats"
        ),
        booking_context AS (
          SELECT DISTINCT keep_id, keep_booking_id
          FROM ranked_chats
        )
        UPDATE "Chats" AS chat
        SET "bookingId" = context.keep_booking_id
        FROM booking_context AS context
        WHERE chat.id = context.keep_id
          AND context.keep_booking_id IS NOT NULL;

        WITH ranked_chats AS (
          SELECT
            id,
            FIRST_VALUE(id) OVER (
              PARTITION BY "clientId", "masterId"
              ORDER BY "updatedAt" DESC, id DESC
            ) AS keep_id
          FROM "Chats"
        )
        DELETE FROM "Chats"
        WHERE id IN (
          SELECT id FROM ranked_chats WHERE id <> keep_id
        );
        `,
        { transaction },
      );

      await queryInterface.addIndex("Chats", ["clientId", "masterId"], {
        unique: true,
        name: "chats_client_master_unique_idx",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Chats", "chats_client_master_unique_idx");
  },
};
