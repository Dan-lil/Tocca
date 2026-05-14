"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProfileMaster extends Model {
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
  ProfileMaster.init(
    {
      userId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      city: DataTypes.STRING,
      address: DataTypes.STRING,
      experience: DataTypes.FLOAT,
      category: DataTypes.STRING,
      rating: DataTypes.FLOAT,
    },
    {
      sequelize,
      modelName: "ProfileMaster",
    },
  );
  return ProfileMaster;
};
