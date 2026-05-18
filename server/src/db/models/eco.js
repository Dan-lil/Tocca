"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Eco extends Model {
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
      // define association here
    }
  }

  Eco.init(
    {
      masterId: DataTypes.INTEGER,
      clientId: DataTypes.INTEGER,
      bookingId: DataTypes.INTEGER,
      rating: DataTypes.INTEGER,
      text: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Eco",
    },
  );
  return Eco;
};
