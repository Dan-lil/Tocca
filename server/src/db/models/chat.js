"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        as: "client",
        foreignKey: "clientId",
      });
      this.belongsTo(models.User, {
        as: "master",
        foreignKey: "masterId",
      });
      this.belongsTo(models.Booking, {
        foreignKey: "bookingId",
      });
      this.hasMany(models.ChatMessage, {
        foreignKey: "chatId",
      });
    }
  }
  Chat.init(
    {
      clientId: DataTypes.INTEGER,
      masterId: DataTypes.INTEGER,
      bookingId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Chat",
    },
  );
  return Chat;
};
