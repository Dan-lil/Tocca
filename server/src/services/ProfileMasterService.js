const { MasterPortfolio, MasterSocial, ProfileMaster, User } = require("../db/models");
const { withAutoProfileEnglish } = require("../utils/translate");

function mapPortfolioItem(item) {
  return {
    id: String(item.id),
    imageUrl: item.portfolioImages,
    title: item.text,
  };
}

class ProfileMasterService {
  static async create(ProfileData) {
    const profileData = await withAutoProfileEnglish(ProfileData);
    const newProfile = await ProfileMaster.create(profileData);

    const plainProfile = newProfile.get();

    return plainProfile;
  }

  static async findByUserId(id) {
    const profile = await ProfileMaster.findOne({ where: { userId: id } });

    return profile ? profile.get() : null;
  }

  static async findPublicByUserId(id) {
    const [user, profile, portfolio, socials] = await Promise.all([
      User.findOne({
        where: { id, role: "master" },
        attributes: ["id", "name", "email", "phone", "avatar"],
      }),
      ProfileMaster.findOne({ where: { userId: id } }),
      MasterPortfolio.findAll({
        where: { userId: id },
        order: [["id", "DESC"]],
      }),
      MasterSocial.findAll({
        where: { userId: id },
        order: [["id", "ASC"]],
      }),
    ]);

    if (!user) {
      return null;
    }

    return {
      user: user.get(),
      profile: profile ? profile.get() : null,
      portfolio: portfolio.map(mapPortfolioItem),
      socials: socials.map((social) => social.get()),
    };
  }

  static async update(id, ProfileData) {
    const profileData = await withAutoProfileEnglish(ProfileData);

    const [profile] = await ProfileMaster.findOrCreate({
      where: { userId: id },
      defaults: {
        ...profileData,
        userId: id,
        rating: profileData.rating ?? 0,
      },
    });

    if (!profile.isNewRecord) {
      await profile.update({
        ...profileData,
        userId: id,
      });
    }

    const plainProfile = profile.get();

    return plainProfile;
  }
}

module.exports = ProfileMasterService;
