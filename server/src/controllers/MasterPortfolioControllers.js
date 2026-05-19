const MasterPortfolioService = require("../services/MasterPortfolioService");
const formatResponse = require("../utils/formatResponse");

class MasterPortfolioController {
  static async createPortfolio(req, res) {
    const data = req.body; //todu подключить мальтер!!!!
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }
    console.log(data);
    data;
    try {
      const create = await MasterPortfolioService.create(data);
      if (!create) {
        return res
          .status(400)
          .json(
            formatResponse(
              400,
              "Неудалось добавить изображение или текст,неверные данные",
            ),
          );
      }
      return res
        .status(200)
        .json(
          formatResponse(200, "Изображение и текст успешно добавлены", create),
        );
    } catch (error) {
      console.log(
        "======== MasterPortfolioController.createPortfolio =========",
      );
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для создания новой карточки портфолио",
          ),
        );
    }
  }

  static async cartDelite(req, res) {
    const { id } = req.params;

    try {
      const cartdelite = await MasterPortfolioService.photoDelite(id);
      if (!cartdelite) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Неудалось удалить карточку профиля проверьте данные или повторите попытку",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Карточка успешно удалена"));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для удаления новой карточки портфолио",
          ),
        );
    }
  }

  static async getPortfolioByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const portfolio = await MasterPortfolioService.findByMasterId(masterId);
      if (!portfolio) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Портфолио для данного мастера не найдено,проверьте данные или повторите попытку",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Портфолио успешно получено", portfolio));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Сервис не может передать нужные данные для получения портфолио мастера",
          ),
        );
    }
  }
}

module.exports = MasterPortfolioController;
