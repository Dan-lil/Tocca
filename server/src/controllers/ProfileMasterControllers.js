const ProfileMasterService = require("../services/ProfileMasterService");
const formatResponse = require("../utils/formatResponse");

class ProfileMasterController {
  static async updateProfile(req, res) {
    const { user } = res.locals;
    const profileData = req.body;

    try {
      const updateProfile = await ProfileMasterService.update(
        user.id,
        profileData,
      );
      if (!updateProfile) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Профиль не удалось обновить,профиль для обновления не найден,а значит пользователь не найден.",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Профиль успешно обновлен!", updateProfile));
    } catch (error) {
      console.log("======== ProfileMasterController.updateProfile =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при продлении сессии"));
    }
  }
}

module.exports = ProfileMasterController;
