const ProfileMasterService = require("../services/ProfileMasterService");
const formatResponse = require("../utils/formatResponse");

class ProfileMasterController {
  static async getMyProfile(req, res) {
    const { user } = res.locals;

    try {
      const profile = await ProfileMasterService.findByUserId(user.id);

      return res.status(200).json(formatResponse(200, "Profile loaded", profile));
    } catch (error) {
      console.log("======== ProfileMasterController.getMyProfile =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load profile"));
    }
  }

  static async getPublicProfile(req, res) {
    const { masterId } = req.params;

    try {
      const profile = await ProfileMasterService.findPublicByUserId(masterId);

      if (!profile) {
        return res.status(404).json(formatResponse(404, "Master profile not found"));
      }

      return res.status(200).json(formatResponse(200, "Master profile loaded", profile));
    } catch (error) {
      console.log("======== ProfileMasterController.getPublicProfile =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load master profile"));
    }
  }

  static async updateProfile(req, res) {
    const { user } = res.locals;
    const profileData = req.body;

    try {
      const updateProfile = await ProfileMasterService.update(user.id, profileData);

      return res.status(200).json(formatResponse(200, "Profile updated", updateProfile));
    } catch (error) {
      console.log("======== ProfileMasterController.updateProfile =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to update profile"));
    }
  }
}

module.exports = ProfileMasterController;
