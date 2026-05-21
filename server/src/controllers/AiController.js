const formatResponse = require("../utils/formatResponse");
const AiService = require("../services/AiService");

class AiController {
  static async getAiResponse(req, res) {
    const { title, text } = req.body;

    if (!title || !text) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "Заголовок и текст обязательны",
            null,
            "Заголовок и текст обязательны",
          ),
        );
    }

    if (text.length > 200 || title.length > 100) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "Заголовок и текст не должны превышать 100 и 200 символов соответственно",
            null,
            "Заголовок и текст не должны превышать 100 и 200 символов соответственно",
          ),
        );
    }

    try {
      const result = await AiService.generateText({ title, text });

      if (!result) {
        return res
          .status(500)
          .json(
            formatResponse(
              500,
              "Ошибка при генерации текста",
              null,
              "Ошибка при генерации текста",
            ),
          );
      }

      return res
        .status(200)
        .json(formatResponse(200, "Ответ получен", result, null));
    } catch (error) {
      console.log("==== AiController.getAiResponse ==== ");
      console.log(error);
      res
        .status(500)
        .json(formatResponse(500, "Внутренняя ошибка сервера", null, error));
    }
  }

  static async getMasterRecommendations(req, res) {
    const {
      clientId,
      bookedMasterIds = [],
      preferredCategoryIds = [],
      clientLat,
      clientLon,
      searchRadius = 50,
      candidateMasters = [],
      limit = 6,
    } = req.body;

    if (!clientId) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "clientId обязателен",
            null,
            "clientId обязателен",
          ),
        );
    }

    if (!Array.isArray(candidateMasters) || candidateMasters.length === 0) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "candidateMasters должен быть непустым массивом",
            null,
            "candidateMasters должен быть непустым массивом",
          ),
        );
    }

    try {
      const payload = {
        bookedMasterIds,
        preferredCategoryIds,
        clientLat: clientLat ? parseFloat(clientLat) : null,
        clientLon: clientLon ? parseFloat(clientLon) : null,
        searchRadius: parseFloat(searchRadius) || 50,
        candidateMasters,
        limit: parseInt(limit) || 6,
      };

      const recommendations = await AiService.getMasterRecommendations(payload);

      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Рекомендации мастеров получены",
            recommendations,
            null,
          ),
        );
    } catch (error) {
      console.log("==== AiController.getMasterRecommendations ==== ");
      console.log(error);
      res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка при получении рекомендаций",
            null,
            error.message,
          ),
        );
    }
  }

  static async getMyMasterRecommendations(req, res) {
    const { user } = res.locals;
    const limit = req.query.limit;

    if (!user?.id) {
      return res
        .status(401)
        .json(formatResponse(401, "Пользователь не авторизован"));
    }

    if (user.role !== "client") {
      return res
        .status(403)
        .json(
          formatResponse(
            403,
            "Рекомендации в профиле доступны только для клиента",
          ),
        );
    }

    try {
      const recommendations = await AiService.getRecommendedMastersForClient(
        user.id,
        { limit },
      );

      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Персональные рекомендации мастеров получены",
            recommendations,
            null,
          ),
        );
    } catch (error) {
      console.log("==== AiController.getMyMasterRecommendations ==== ");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка при получении персональных рекомендаций",
            null,
            error.message,
          ),
        );
    }
  }
  static async getGeoSortedMasters(req, res) {
    const {
      clientLat,
      clientLon,
      radiusKm = 10,
      categoryId = null, // ← ДОБАВИЛИ: извлекаем categoryId
      masters = [],
    } = req.body;

    if (!Array.isArray(masters) || masters.length === 0) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "masters должен быть непустым массивом",
            null,
            "masters обязателен",
          ),
        );
    }
    try {
      const payload = {
        clientLat: clientLat ? parseFloat(clientLat) : null,
        clientLon: clientLon ? parseFloat(clientLon) : null,
        radiusKm: parseFloat(radiusKm) || 10,
        categoryId: categoryId ? parseInt(categoryId) : null, // ← ДОБАВИЛИ: передаём categoryId
        masters,
      };

      const result = await AiService.getGeoSortedMasters(payload);
      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Мастера отсортированы по геопозиции",
            result,
            null,
          ),
        );
    } catch (error) {
      console.log("==== AiController.getGeoSortedMasters ==== ");
      console.log(error);
      res
        .status(500)
        .json(
          formatResponse(500, "Ошибка гео-сортировки", null, error.message),
        );
    }
  }
}

module.exports = AiController;
