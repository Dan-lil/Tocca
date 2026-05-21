"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      this.belongsTo(models.Chat, {
        foreignKey: "chatId",
      });
      this.belongsTo(models.User, {
        as: "sender",
        foreignKey: "senderId",
      });
    }
  }

  ChatMessage.init(
    {
      chatId: DataTypes.INTEGER,
      senderId: DataTypes.INTEGER,
      text: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "ChatMessage",
    },
  );

  return ChatMessage;
};
