const { User } = require("../db/models");

class AuthService {
  static async findUserByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    return (await User.findOne({ where: { email: normalizedEmail } }))?.get();
  }

  static async findUserById(id) {
    const user = await User.findByPk(id);

    if (!user) {
      return null;
    }

    const plainUser = user.get();
    delete plainUser.password;

    return plainUser;
  }

  static async createUser(userData) {
    const newUser = await User.create({
      ...userData,
      email: userData.email.toLowerCase().trim(),
    });

    const plainUser = newUser.get();
    delete plainUser.password;

    return plainUser;
  }

  static async findUserByTelegramId(telegramId) {
    if (!telegramId) {
      return null;
    }

    return (await User.findOne({ where: { telegramId: String(telegramId) } }))?.get();
  }

  static async findUserByTelegramUsername(telegramUsername) {
    if (!telegramUsername) {
      return null;
    }

    return (
      await User.findOne({
        where: { telegramUsername: telegramUsername.toLowerCase().trim() },
      })
    )?.get();
  }

  static async upsertTelegramUser(telegramData) {
    const telegramId = String(telegramData.id);
    const telegramUsername = telegramData.username
      ? telegramData.username.toLowerCase().trim()
      : null;
    const selectedRole = telegramData.role === "master" ? "master" : "client";
    const defaultName =
      [telegramData.first_name, telegramData.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || `Telegram User ${telegramId}`;
    const avatarUrl = telegramData.photo_url || "";
    const defaultEmail = `telegram_${telegramId}@telegram.local`;

    const userById = await User.findOne({ where: { telegramId } });
    const userByUsername = telegramUsername
      ? await User.findOne({ where: { telegramUsername } })
      : null;
    const targetUser = userById || userByUsername;

    if (targetUser) {
      await targetUser.update({
        name: defaultName,
        avatar: avatarUrl || targetUser.avatar || "",
        telegramId,
        telegramUsername,
        role: targetUser.role || selectedRole,
        authProvider: "telegram",
      });

      const plainUser = targetUser.get();
      delete plainUser.password;
      return plainUser;
    }

    const newUser = await User.create({
      name: defaultName,
      email: defaultEmail,
      password: telegramData.passwordHash,
      role: selectedRole,
      avatar: avatarUrl,
      telegramId,
      telegramUsername,
      authProvider: "telegram",
    });

    const plainUser = newUser.get();
    delete plainUser.password;
    return plainUser;
  }

  static async delite(id) {
    await User.destroy({ where: { id: id } });
  }

  static async update(id) {
    const user = await User.findByPk(id);
    if (!user) {
      return;
    }
    if (user.role === "master" || user.role === "admin") {
      return user.get();
    }
    user.role = "client";
    await user.save();
    return user.get();
  }

  static async updateProfile(id, userData) {
    const user = await User.findByPk(id);

    if (!user) {
      return null;
    }

    await user.update({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      avatar: userData.avatar,
    });

    const plainUser = user.get();
    delete plainUser.password;

    return plainUser;
  }
}

module.exports = AuthService;
