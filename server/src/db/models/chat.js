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
        foreignKey: "masterId",
      });
      this.belongsTo(models.User, {
        foreignKey: "clientId",
      });
      this.belongsTo(models.Booking, {
        foreignKey: "bookingId",
      });
      this.hasMany(models.Message, {
        foreignKey: "chatId",
      });
      // define association here
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
