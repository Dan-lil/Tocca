const { where } = require("sequelize");
const { MasterPortfolio } = require("../db/models");

class ProfileMasterService {
  static async create(data) {
    const res = await MasterPortfolio.create(data);
    if (!res) {
      return null;
    }
    const result = res.get();

    return result;
  }

  static async photoDelite(id) {
    const res = await MasterPortfolio.destroy({ where: { id } });
    return true;
  }

  static async findByMasterId(masterId) {
    const res = await MasterPortfolio.findAll({ where: { masterId } });
    if (!res) {
      return null;
    }
    return res.map((item) => item.get());
  }
}

module.exports = ProfileMasterService;
