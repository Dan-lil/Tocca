"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "userId",
      });
      this.belongsTo(models.Chat, {
        foreignKey: "chatId",
      });
      // define association here
    }
  }
  Message.init(
    {
      userId: DataTypes.INTEGER,
      chatId: DataTypes.INTEGER,
      status: DataTypes.STRING,
      text: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Message",
    },
  );
  return Message;
};
