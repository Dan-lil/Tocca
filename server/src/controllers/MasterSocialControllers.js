const MasterSocialService = require("../services/MasterSocialService");
const formatResponse = require("../utils/formatResponse");

class MasterSocialController {
  static async findSocial(req, res) {
    const { user } = res.locals;

    try {
      const social = await MasterSocialService.findSocial(user.id);
      if (!social) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Социальные сети не найдены для данного пользователя",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Социальные сети успешно получены!", social));
    } catch (error) {
      console.log("======== MasterSocialController.findSocial =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при получении социальных сетей пользователя из за неизвестной ошибки",
          ),
        );
    }
  }

  static async createSocial(req, res) {
    const { user } = res.locals;
    // console.log(user);

    const socialData = req.body;
    // console.log(socialData);

    try {
      const newSocial = await MasterSocialService.createSocial({
        ...socialData,
        userId: user.id,
      });
      return res
        .status(201)
        .json(
          formatResponse(201, "Социальные сети успешно созданы!", newSocial),
        );
    } catch (error) {
      console.log("======== MasterSocialController.createSocial =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при создании социальных сетей пользователя из за неизвестной ошибки",
          ),
        );
    }
  }

  static async deleteSocial(req, res) {
    const { user } = res.locals;
    const { id } = req.params;

    try {
      await MasterSocialService.deleteSocial(id);
      return res
        .status(200)
        .json(formatResponse(200, "Социальные сети успешно удалены!"));
    } catch (error) {
      console.log("======== MasterSocialController.deleteSocial =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при удалении социальных сетей пользователя из за неизвестной ошибки",
          ),
        );
    }
  }

  static async updateSocial(req, res) {
    const { user } = res.locals;
    const socialData = req.body;

    try {
      const updateSocial = await MasterSocialService.updateSocial(
        user.id,
        socialData,
      );
      if (!updateSocial) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Социальные сети не удалось обновить,социальные сети для обновления не найдены,а значит пользователь не найден.",
            ),
          );
      }
      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Социальные сети успешно обновлены!",
            updateSocial,
          ),
        );
    } catch (error) {
      console.log("======== MasterSocialController.updateSocial =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при продлении сессии или произошла неизвестная ошибка",
          ),
        );
    }
  }
}

module.exports = MasterSocialController;
