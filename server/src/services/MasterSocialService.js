const { where } = require("sequelize");
const { MasterSocial } = require("../db/models");

class MasterSocialService {
  static async findSocial(id) {
    const res = await MasterSocial.findAll({ where: { userId: id } });
    if (!res) {
      return null;
    }
    return res;
  }

  static async createSocial(SocialData) {
    const newSocial = await MasterSocial.create(SocialData);

    const plainSocial = newSocial.get();

    return plainSocial;
  }

  static async updateSocial(id, SocialData) {
    const [rows] = await MasterSocial.update(SocialData, {
      where: { userId: id },
    });

    if (rows === 0) {
      return null;
    }
    const social = await MasterSocial.findOne({ where: { userId: id } });

    const plainSocial = social.get();

    return plainSocial;
  }

  static async deleteSocial(id) {
    await MasterSocial.destroy({ where: { id: id } });
    return true;
  }
}

module.exports = MasterSocialService;
