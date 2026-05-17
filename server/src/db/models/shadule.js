"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Shadule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "masterId",
      });
      // define association here
    }
  }
  Shadule.init(
    {
      masterId: DataTypes.INTEGER,
      dayOdWeek: DataTypes.INTEGER,
      startTime: DataTypes.DATE,
      endTime: DataTypes.DATE,
      isWorkingDay: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Shadule",
    },
  );
  return Shadule;
};
