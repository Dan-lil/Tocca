const ShaduleService = require("../services/ShaduleService");
const formatResponse = require("../utils/formatResponse");

class ShaduleController {
  static async create(req, res) {
    const shaduleData = req.body;
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
      const masterId = user.id ?? shaduleData.masterId;

      if (!masterId) {
        return res
          .status(400)
          .json(formatResponse(400, "Не удалось определить мастера для графика"));
      }

      const newShadule = await ShaduleService.create({
        ...shaduleData,
        masterId,
      });
      return res
        .status(201)
        .json(formatResponse(201, "График успешно создан!", newShadule));
    } catch (error) {
      console.log("======== ShaduleController.create =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при создании графика",
            null,
            error.message,
          ),
        );
    }
  }

  static async findByAllMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const shadules = await ShaduleService.findAllByMasterId(masterId);
      if (!shadules || shadules.length === 0) {
        return res
          .status(404)
          .json(formatResponse(404, "График для данного мастера не найден"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "График успешно найден!", shadules));
    } catch (error) {
      console.log("======== ShaduleController.findByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при поиске графика"));
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const shaduleData = req.body;
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
      const masterId = user.id ?? shaduleData.masterId;

      if (!masterId) {
        return res
          .status(400)
          .json(formatResponse(400, "Не удалось определить мастера для графика"));
      }

      const updatedShadule = await ShaduleService.update(id, {
        ...shaduleData,
        masterId,
      });
      if (!updatedShadule) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "График не удалось обновить, график для обновления не найден.",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "График успешно обновлен!", updatedShadule));
    } catch (error) {
      console.log("======== ShaduleController.update =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при обновлении графика",
            null,
            error.message,
          ),
        );
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
      await ShaduleService.delete(id);
      return res.status(200).json(formatResponse(200, "График успешно удален"));
    } catch (error) {
      console.log("======== ShaduleController.delete =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении графика"));
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
      await ShaduleService.deleteByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Графики успешно удалены"));
    } catch (error) {
      console.log("======== ShaduleController.deleteByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении графиков"));
    }
  }

  static async findAll(req, res) {
    try {
      const shadules = await ShaduleService.findAll();
      return res
        .status(200)
        .json(formatResponse(200, "Графики успешно найдены!", shadules));
    } catch (error) {
      console.log("======== ShaduleController.findAll =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при поиске графиков"));
    }
  }

  static async findById(req, res) {
    const { id } = req.params;

    try {
      const shadule = await ShaduleService.findById(id);
      if (!shadule) {
        return res.status(404).json(formatResponse(404, "График не найден"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "График успешно найден!", shadule));
    } catch (error) {
      console.log("======== ShaduleController.findById =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при поиске графика"));
    }
  }

  static async deleteByDayOfWeek(req, res) {
    const { dayOfWeek } = req.params;
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
      await ShaduleService.deleteByDayOfWeek(dayOfWeek);
      return res
        .status(200)
        .json(formatResponse(200, "Графики успешно удалены"));
    } catch (error) {
      console.log("======== ShaduleController.deleteByDayOfWeek =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении графиков"));
    }
  }
}

module.exports = ShaduleController;
