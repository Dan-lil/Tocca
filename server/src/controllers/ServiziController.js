const ServiziService = require("../services/ServiziService");
const formatResponse = require("../utils/formatResponse");

class ServiziController {
  static async create(req, res) {
    const serviziData = req.body;
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

    try {
      const newServizi = await ServiziService.create(serviziData);
      return res
        .status(201)
        .json(formatResponse(201, "Сервис успешно создан!", newServizi));
    } catch (error) {
      console.log("======== ServiziController.create =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при создании сервиса"));
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const serviziData = req.body;
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

    try {
      const updatedServizi = await ServiziService.update(id, serviziData);
      if (!updatedServizi) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Сервис не удалось обновить, сервис для обновления не найден.",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Сервис успешно обновлен!", updatedServizi));
    } catch (error) {
      console.log("======== ServiziController.update =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при обновлении сервиса"));
    }
  }

  static async findAllByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const serviziList = await ServiziService.findAllByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Сервисы успешно получены!", serviziList));
    } catch (error) {
      console.log("======== ServiziController.findAllByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении сервисов"));
    }
  }

  static async findAllByCategoryId(req, res) {
    const { categoryId } = req.params;

    try {
      const servizifind = await ServiziService.findAllByCategoryId(categoryId);
      return res
        .status(200)
        .json(formatResponse(200, "Сервисы успешно получены!", servizifind));
    } catch (error) {
      console.log("======== ServiziController.findAllByCategoryId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении сервисов"));
    }
  }

  static async findAll(req, res) {
    try {
      const serviziList = await ServiziService.findAll();
      return res
        .status(200)
        .json(formatResponse(200, "Сервисы успешно получены!", serviziList));
    } catch (error) {
      console.log("======== ServiziController.findAll =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении сервисов"));
    }
  }

  static async findById(req, res) {
    const { id } = req.params;

    try {
      const servizi = await ServiziService.findById(id);
      if (!servizi) {
        return res.status(404).json(formatResponse(404, "Сервис не найден"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Сервис успешно получен!", servizi));
    } catch (error) {
      console.log("======== ServiziController.findById =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении сервиса"));
    }
  }

  static async findByActive(req, res) {
    const { isActive } = req.params;

    try {
      const serviziList = await ServiziService.findByActive(isActive);
      return res
        .status(200)
        .json(formatResponse(200, "Сервисы успешно получены!", serviziList));
    } catch (error) {
      console.log("======== ServiziController.findByActive =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении сервисов"));
    }
  }

  static async delete(req, res) {
    const { id } = req.params;
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

    try {
      await ServiziService.delete(id);
      return res
        .status(200)
        .json(formatResponse(200, "Сервис успешно удален!"));
    } catch (error) {
      console.log("======== ServiziController.delete =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении сервиса"));
    }
  }

  static async deleteByActive(req, res) {
    const { isActive } = req.query;
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

    try {
      await ServiziService.deleteByActive(isActive);
      return res
        .status(200)
        .json(formatResponse(200, "Сервисы успешно удалены!"));
    } catch (error) {
      console.log("======== ServiziController.deleteByActive =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении сервисов"));
    }
  }

  static async deleteByMasterId(req, res) {
    const { masterId } = req.params;
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

    try {
      await ServiziService.deleteByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Сервисы успешно удалены!"));
    } catch (error) {
      console.log("======== ServiziController.deleteByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении сервисов"));
    }
  }
}

module.exports = ServiziController;
