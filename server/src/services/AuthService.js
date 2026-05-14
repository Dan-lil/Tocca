const { User } = require("../db/models");

class AuthService {
  static async findUserByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    return (await User.findOne({ where: { email: normalizedEmail } }))?.get();
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
}

module.exports = AuthService;
