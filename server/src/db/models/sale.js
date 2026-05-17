"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
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

      // define association here

      // define association here
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
      date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Sale",
    },
  );
  return Sale;
};
