"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MasterPortfolio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "userId",
      });
      // define association here
    }
  }
  MasterPortfolio.init(
    {
      userId: DataTypes.INTEGER,
      portfolioImages: DataTypes.TEXT,
      text: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "MasterPortfolio",
    },
  );
  return MasterPortfolio;
};
