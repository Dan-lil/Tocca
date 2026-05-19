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
