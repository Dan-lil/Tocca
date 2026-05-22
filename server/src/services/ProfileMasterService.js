const { Eco, MasterPortfolio, MasterSocial, ProfileMaster, User } = require("../db/models");
const { withAutoProfileEnglish } = require("../utils/translate");

function mapPortfolioItem(item) {
  return {
    id: String(item.id),
    imageUrl: item.portfolioImages,
    title: item.text,
  };
}

function getAverageRating(reviews) {
  if (!reviews.length) {
    return 0;
  }

  const total = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);

  return Number((total / reviews.length).toFixed(1));
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
    const [user, profile, portfolio, socials, reviews] = await Promise.all([
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
      Eco.findAll({
        where: { masterId: id },
        attributes: ["rating"],
      }),
    ]);

    if (!user) {
      return null;
    }

    const plainProfile = profile ? profile.get() : null;

    return {
      user: user.get(),
      profile: plainProfile
        ? {
            ...plainProfile,
            rating: getAverageRating(reviews),
          }
        : null,
      portfolio: portfolio.map(mapPortfolioItem),
      socials: socials.map((social) => social.get()),
    };
  }

  static async update(id, ProfileData) {
    const editableProfileData = { ...ProfileData };
    delete editableProfileData.rating;
    const profileData = await withAutoProfileEnglish(editableProfileData);

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
