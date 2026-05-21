const ProfileMasterService = require("../services/ProfileMasterService");
const formatResponse = require("../utils/formatResponse");
const YandexGeocoderService = require("../services/YandexGeocoderService");
const { ProfileMaster } = require("../db/models");

class ProfileMasterController {
  static async getMyProfile(req, res) {
    const { user } = res.locals;

    try {
      const profile = await ProfileMasterService.findByUserId(user.id);

      return res
        .status(200)
        .json(formatResponse(200, "Profile loaded", profile));
    } catch (error) {
      console.log("======== ProfileMasterController.getMyProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to load profile"));
    }
  }

  static async getPublicProfile(req, res) {
    const { masterId } = req.params;

    try {
      const profile = await ProfileMasterService.findPublicByUserId(masterId);

      if (!profile) {
        return res
          .status(404)
          .json(formatResponse(404, "Master profile not found"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Master profile loaded", profile));
    } catch (error) {
      console.log(
        "======== ProfileMasterController.getPublicProfile =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to load master profile"));
    }
  }

  static async updateProfile(req, res) {
    const { user } = res.locals;
    const profileData = req.body;

    try {
      const updateProfile = await ProfileMasterService.update(
        user.id,
        profileData,
      );

      return res
        .status(200)
        .json(formatResponse(200, "Profile updated", updateProfile));
    } catch (error) {
      console.log("======== ProfileMasterController.updateProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Failed to update profile"));
    }
  }

  static async updateMasterLocation(req, res) {
    const { user } = res.locals;
    const { address, lat, lon } = req.body;

    if (!user?.id || user.role !== "master") {
      return res.status(403).json(formatResponse(403, "Доступ запрещён"));
    }

    try {
      let coordinates = { lat, lon };

      if ((lat === undefined || lon === undefined) && address) {
        const geo = await YandexGeocoderService.geocodeAddress(address);
        if (geo) {
          coordinates = { lat: geo.lat, lon: geo.lon };
        }
      }

      const [updated] = await ProfileMaster.update(
        {
          latitude: coordinates.lat,
          longitude: coordinates.lon,
          ...(address && { address }),
        },
        { where: { userId: user.id } },
      );

      if (!updated) {
        return res
          .status(404)
          .json(formatResponse(404, "Профиль мастера не найден"));
      }

      return res.status(200).json(
        formatResponse(200, "Координаты обновлены", {
          lat: coordinates.lat,
          lon: coordinates.lon,
        }),
      );
    } catch (error) {
      console.log("==== ProfileMasterControllers.updateMasterLocation ====");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка обновления координат",
            null,
            error.message,
          ),
        );
    }
  }
}

module.exports = ProfileMasterController;
