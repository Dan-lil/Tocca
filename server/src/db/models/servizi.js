"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Servizi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "masterId",
      });
      this.belongsTo(models.Category, {
        foreignKey: "categoryId",
      });
      this.hasMany(models.Booking, {
        foreignKey: "serviziId",
      });
      this.hasMany(models.Sale, {
        foreignKey: "serviziId",
      });
      // define association here
    }
  }
  Servizi.init(
    {
      masterId: DataTypes.INTEGER,
      title: DataTypes.STRING,
      titleEn: DataTypes.STRING,
      description: DataTypes.STRING,
      descriptionEn: DataTypes.STRING,
      price: DataTypes.FLOAT,
      duration: DataTypes.FLOAT,
      categoryId: DataTypes.INTEGER,
      isActive: DataTypes.BOOLEAN,
      image: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Servizi",
    },
  );
  return Servizi;
};
