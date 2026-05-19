const { MasterPortfolio, ProfileMaster, User } = require("../db/models");

function mapPortfolioItem(item) {
  return {
    id: String(item.id),
    imageUrl: item.portfolioImages,
    title: item.text,
  };
}

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

  static async findPublicByUserId(id) {
    const [user, profile, portfolio] = await Promise.all([
      User.findOne({
        where: { id, role: "master" },
        attributes: ["id", "name", "email", "phone", "avatar"],
      }),
      ProfileMaster.findOne({ where: { userId: id } }),
      MasterPortfolio.findAll({
        where: { userId: id },
        order: [["id", "DESC"]],
      }),
    ]);

    if (!user) {
      return null;
    }

    return {
      user: user.get(),
      profile: profile ? profile.get() : null,
      portfolio: portfolio.map(mapPortfolioItem),
    };
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
