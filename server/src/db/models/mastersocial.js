"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class MasterSocial extends Model {
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
  MasterSocial.init(
    {
      userId: DataTypes.INTEGER,
      telegram: DataTypes.STRING,
      inst: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "MasterSocial",
    },
  );
  return MasterSocial;
};
