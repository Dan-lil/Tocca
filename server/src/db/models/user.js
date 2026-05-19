"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.ProfileMaster, {
        foreignKey: "userId",
      });
      this.hasMany(models.MasterPortfolio, {
        foreignKey: "userId",
      });
      this.hasMany(models.MasterSocial, {
        foreignKey: "userId",
      });
      this.hasMany(models.Servizi, {
        foreignKey: "masterId",
      });
      this.hasMany(models.Booking, {
        foreignKey: "clientId",
      });
      this.hasMany(models.Booking, {
        foreignKey: "masterId",
      });
      this.hasMany(models.Sale, {
        foreignKey: "masterId",
      });
      this.hasMany(models.Shadule, {
        foreignKey: "masterId",
      });
      this.hasMany(models.Eco, {
        foreignKey: "masterId",
      });
      this.hasMany(models.Eco, {
        foreignKey: "clientId",
      });
      this.hasMany(models.Chat, {
        foreignKey: "masterId",
      });
      this.hasMany(models.Chat, {
        foreignKey: "clientId",
      });
      // define association here

      // define association here
    }

    static validateEmail(email) {
      const emailPattern = /^[A-z0-9!-_%.]+@[A-z0-9.-]+\.[A-z]{2,}$/;
      return emailPattern.test(email);
    }

    static validatePassword(password) {
      const hasUpperCase = /[A-Z]/;
      const hasLowerCase = /[a-z]/;
      const hasDigits = /\d/;
      const hasSpecialSymbols = /[!@#$%^&*()-+,.""<>{}]/;
      const isValidLength = password.length >= 8;

      if (
        !hasUpperCase.test(password) ||
        !hasLowerCase.test(password) ||
        !hasDigits.test(password) ||
        !hasSpecialSymbols.test(password) ||
        !isValidLength
      ) {
        return false;
      }
      return true;
    }

    static validateRegistrationData(userData) {
      const { name, email, password } = userData; // Изменено: name → login

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return { isValid: false, error: "Некорректное имя пользователя" };
      }

      if (
        !email ||
        typeof email !== "string" ||
        email.trim().length === 0 ||
        !this.validateEmail(email)
      ) {
        return {
          isValid: false,
          error: "Некорректный адрес электронной почты",
        };
      }

      if (
        !password ||
        typeof password !== "string" ||
        password.trim().length === 0 ||
        !this.validatePassword(password)
      ) {
        return {
          isValid: false,
          error: "Пароль не соответствует критериям валидации",
        };
      }

      return { isValid: true, error: null };
    }

    static validateLoginData(userData) {
      const { email, password } = userData;

      if (
        !email ||
        typeof email !== "string" ||
        email.trim().length === 0 ||
        !this.validateEmail(email)
      ) {
        return {
          isValid: false,
          error: "Некорректный адрес электронной почты",
        };
      }

      if (
        !password ||
        typeof password !== "string" ||
        password.trim().length === 0 ||
        !this.validatePassword(password)
      ) {
        return {
          isValid: false,
          error: "Пароль не соответствует критериям валидации",
        };
      }

      return { isValid: true, error: null };
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      phone: DataTypes.STRING,
      avatar: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    },
  );
  return User;
};
