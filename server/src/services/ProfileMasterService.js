const { ProfileMaster } = require("../db/models");

class ProfileMasterService {
  static async create(ProfileData) {
    const newProfile = await ProfileMaster.create(ProfileData);

    const plainProfile = newProfile.get();

    return plainProfile;
  }

  static async update(id, ProfileData) {
    const [rows] = await ProfileMaster.update(ProfileData, {
      where: { userId: id },
    });

    if (rows === 0) {
      return null;
    }
    const profile = await ProfileMaster.findOne({ where: { userId: id } });

    const plainProfile = profile.get();

    return plainProfile;
  }
}

module.exports = ProfileMasterService;
