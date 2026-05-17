"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "clientId",
      });
      this.belongsTo(models.User, {
        foreignKey: "masterId",
      });
      this.belongsTo(models.Servizi, {
        foreignKey: "serviziId",
      });
      this.hasOne(models.Sale, {
        foreignKey: "bookingId",
      });
      // define association here
    }
  }
  Booking.init(
    {
      clientId: DataTypes.INTEGER,
      masterId: DataTypes.INTEGER,
      serviziId: DataTypes.INTEGER,
      date: DataTypes.DATE,
      startTime: DataTypes.DATE,
      endTime: DataTypes.DATE,
      status: DataTypes.STRING,
      clientComment: DataTypes.STRING,
      cancelReason: {
        type: DataTypes.STRING,
        defaultValue: "Отменено без указания причин",
      },
    },
    {
      sequelize,
      modelName: "Booking",
    },
  );
  return Booking;
};
