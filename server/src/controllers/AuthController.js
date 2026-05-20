const AuthService = require("../services/AuthService");
const formatResponse = require("../utils/formatResponse");
const { User } = require("../db/models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs/promises");
const generateTokens = require("../utils/generateTokens");
const path = require("path");
const cookieConfig = require("../config/cookieConfig");
const verifyTelegramAuth = require("../utils/verifyTelegramAuth");

async function saveProfileAvatar(imageFile) {
  if (!imageFile?.data || !imageFile?.type) {
    return null;
  }

  const match = imageFile.data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid avatar file");
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const extension = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const allowedExtensions = new Set(["jpg", "png", "webp", "gif"]);

  if (!allowedExtensions.has(extension)) {
    throw new Error("Unsupported avatar file type");
  }

  const uploadsDir = path.join(__dirname, "../public/uploads/profile");
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

  return `/uploads/profile/${fileName}`;
}

class AuthController {
  static async register(req, res) {
    // Достаём данные для регистрации из тела запроса
    const { name, email, password, role } = req.body;

    // Проводим валидацию данных для регистрации
    const { isValid, error } = User.validateRegistrationData({
      name,
      email,
      password,
    });

    if (!isValid) {
      return res
        .status(400)
        .json(formatResponse(400, "Ошибка валидации", null, error));
    }

    // Нормализуем email для поиска существующего пользователя
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const existingUser = await AuthService.findUserByEmail(normalizedEmail);

      if (existingUser) {
        return res
          .status(400)
          .json(formatResponse(400, "Пользователь уже зарегистрирован"));
      }
      // Хэшируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // создаём нового пользователя
      const newUser = await AuthService.createUser({
        name,
        email,
        password: hashedPassword,
        role,
      });

      if (!newUser) {
        return res
          .status(500)
          .json(formatResponse(500, "Ошибка при создании пользователя"));
      }
      // удаляем информацию о пароле перед ответом от сервера
      delete newUser.password;

      // генерируем токены
      const { accessToken, refreshToken } = generateTokens({ user: newUser });

      // формируем ответ
      return res
        .status(201)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(201, "Регистрация успешна", {
            user: newUser,
            accessToken,
          }),
        );
    } catch (error) {
      console.log("======== AuthController.register =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при регистрации пользователя"),
        );
    }
  }

  static async login(req, res) {
    // Достаём данные для логина из тела запроса
    const { email, password } = req.body;

    // Проводим валидацию данных для логина
    const { isValid, error } = User.validateLoginData({
      email,
      password,
    });

    if (!isValid) {
      return res
        .status(400)
        .json(formatResponse(400, "Ошибка валидации", null, error));
    }

    // Нормализуем email для поиска существующего пользователя
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const existingUser = await AuthService.findUserByEmail(normalizedEmail);

      if (!existingUser) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Пользователь с таким адресом не зарегистрирован",
            ),
          );
      }
      // Сравниваем хэши паролей
      const isValidPassword = await bcrypt.compare(
        password,
        existingUser.password,
      );

      if (!isValidPassword) {
        return res
          .status(400)
          .json(formatResponse(400, "Неверные данные для входа"));
      }

      // удаляем информацию о пароле перед ответом от сервера
      delete existingUser.password;

      // генерируем токены
      const { accessToken, refreshToken } = generateTokens({
        user: existingUser,
      });

      // формируем ответ
      return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(200, "Успешный вход в приложение", {
            user: existingUser,
            accessToken,
          }),
        );
    } catch (error) {
      console.log("======== AuthController.login =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при входе в приложение"));
    }
  }

  static async telegramLogin(req, res) {
    const { role, ...telegramData } = req.body || {};

    try {
      const parsedMaxAge = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS);
      const maxAgeSeconds =
        Number.isFinite(parsedMaxAge) && parsedMaxAge > 0 ? parsedMaxAge : 86400;
      const authCheck = verifyTelegramAuth(
        telegramData,
        process.env.TELEGRAM_BOT_TOKEN,
        maxAgeSeconds,
      );

      if (!authCheck.isValid) {
        return res.status(400).json(formatResponse(400, authCheck.error));
      }

      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
      const user = await AuthService.upsertTelegramUser({
        ...telegramData,
        role,
        passwordHash,
      });

      const { accessToken, refreshToken } = generateTokens({ user });

      return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(200, "Успешный вход через Telegram", {
            user,
            accessToken,
          }),
        );
    } catch (error) {
      console.log("======== AuthController.telegramLogin =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при входе через Telegram"));
    }
  }

  static async logout(req, res) {
    try {
      // формируем ответ
      return res
        .status(200)
        .clearCookie("refreshToken")
        .json(formatResponse(200, "Успешный выход "));
    } catch (error) {
      console.log("======== AuthController.logout =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при выходе из приложения"));
    }
  }

  static async updateProfile(req, res) {
    const { user } = res.locals;
    const { name, email, phone, avatar, avatarFile } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res
        .status(400)
        .json(formatResponse(400, "Ошибка валидации", null, "Некорректное имя пользователя"));
    }

    if (!email || typeof email !== "string" || !User.validateEmail(email)) {
      return res
        .status(400)
        .json(formatResponse(400, "Ошибка валидации", null, "Некорректный адрес электронной почты"));
    }

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await AuthService.findUserByEmail(normalizedEmail);

      if (existingUser && existingUser.id !== user.id) {
        return res
          .status(400)
          .json(formatResponse(400, "Пользователь с такой почтой уже существует"));
      }

      const avatarUrl = avatarFile ? await saveProfileAvatar(avatarFile) : avatar;
      const updatedUser = await AuthService.updateProfile(user.id, {
        name: name.trim(),
        email: normalizedEmail,
        phone: typeof phone === "string" ? phone.trim() : "",
        avatar: typeof avatarUrl === "string" ? avatarUrl.trim() : "",
      });

      if (!updatedUser) {
        return res
          .status(404)
          .json(formatResponse(404, "Пользователь не найден"));
      }

      const { accessToken, refreshToken } = generateTokens({ user: updatedUser });

      return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(200, "Профиль обновлен", {
            user: updatedUser,
            accessToken,
          }),
        );
    } catch (error) {
      console.log("======== AuthController.updateProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при обновлении профиля"));
    }
  }

  static async refreshTokens(req, res) {
    // Достаём данные о пользователе из res.locals (их туда положила мидлварка verifyRefreshToken)

    const { user } = res.locals;

    try {
      // генерируем токены
      const { accessToken, refreshToken } = generateTokens({
        user,
      });

      // формируем ответ
      return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieConfig)
        .json(
          formatResponse(200, "Пользовательская сессия продлена", {
            user,
            accessToken,
          }),
        );
    } catch (error) {
      console.log("======== AuthController.refreshTokens =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при продлении сессии"));
    }
  }
}

module.exports = AuthController;
