const { ProfileMaster } = require("../db/models");

class ProfileMasterService {
  static async create(ProfileData) {
    const newProfile = await ProfileMaster.create(ProfileData);

    const plainProfile = newProfile.get();

    return plainProfile;
  }

  static async findByUserId(id) {
    const profile = await ProfileMaster.findOne({ where: { userId: id } });

    return profile ? profile.get() : null;
  }

  static async update(id, ProfileData) {
    const [profile] = await ProfileMaster.findOrCreate({
      where: { userId: id },
      defaults: {
        ...ProfileData,
        userId: id,
        rating: ProfileData.rating ?? 0,
      },
    });

    if (!profile.isNewRecord) {
      await profile.update({
        ...ProfileData,
        userId: id,
      });
    }

    const plainProfile = profile.get();

    return plainProfile;
  }
}

module.exports = ProfileMasterService;
