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
}

module.exports = ProfileMasterService;
