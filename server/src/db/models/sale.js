"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "masterId",
      });
      this.belongsTo(models.Booking, {
        foreignKey: "bookingId",
      });
      this.belongsTo(models.Servizi, {
        foreignKey: "serviziId",
      });
    }
  }

  Sale.init(
    {
      masterId: DataTypes.INTEGER,
      bookingId: DataTypes.INTEGER,
      serviziId: DataTypes.INTEGER,
      finalPrice: DataTypes.FLOAT,
      discount: DataTypes.FLOAT,
      comment: DataTypes.STRING,
      image: DataTypes.STRING,
      date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Sale",
    },
  );

  return Sale;
};
