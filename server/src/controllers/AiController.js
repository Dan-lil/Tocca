const formatResponse = require("../utils/formatResponse");
const AiService = require("../services/AiService");
const BookingService = require("../services/BookingService");

function getBookingErrorStatus(error) {
  const message = String(error?.message ?? "").toLowerCase();
  const name = String(error?.name ?? "").toLowerCase();

  if (name.includes("validation") || name.includes("unique")) {
    return 400;
  }

  if (message.includes("занято")) {
    return 409;
  }

  if (
    message.includes("обяз") ||
    message.includes("некоррект") ||
    message.includes("не найден") ||
    message.includes("не принадлежит") ||
    message.includes("недоступна") ||
    message.includes("позже времени начала")
  ) {
    return 400;
  }

  return 500;
}

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
      radiusKm = 15,
      categoryId,
      masters = [],
    } = req.body;

    if (!Number.isFinite(Number(clientLat)) || !Number.isFinite(Number(clientLon))) {
      return res
        .status(400)
        .json(formatResponse(400, "Координаты клиента обязательны"));
    }

    if (!Array.isArray(masters)) {
      return res
        .status(400)
        .json(formatResponse(400, "masters должен быть массивом"));
    }

    try {
      const sortedMasters = await AiService.getGeoSortedMasters({
        clientLat: Number(clientLat),
        clientLon: Number(clientLon),
        radiusKm: Number(radiusKm) || 15,
        categoryId: categoryId ? Number(categoryId) : null,
        masters,
      });

      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Мастера рядом успешно отсортированы",
            sortedMasters,
            null,
          ),
        );
    } catch (error) {
      console.log("==== AiController.getGeoSortedMasters ==== ");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка при поиске мастеров рядом",
            null,
            error.message,
          ),
        );
    }
  }

  static async searchBookingOptions(req, res) {
    const { user } = res.locals;
    const { prompt, limit, useAI = true } = req.body;

    if (!user?.id) {
      return res
        .status(401)
        .json(formatResponse(401, "Пользователь не авторизован"));
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res
        .status(400)
        .json(formatResponse(400, "Опишите, какую запись вы хотите"));
    }

    try {
      const options = await AiService.searchBookingOptions(prompt, user.id, {
        limit,
        useAI,
      });

      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Подобраны варианты записи",
            options,
            null,
          ),
        );
    } catch (error) {
      console.log("==== AiController.searchBookingOptions ==== ");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка при подборе вариантов записи",
            null,
            error.message,
          ),
        );
    }
  }

  static async createBookingFromAssistant(req, res) {
    const { user } = res.locals;
    const { masterId, serviziId, startTime, endTime, date, clientComment } =
      req.body;

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
            "AI-помощник по записи доступен только клиенту",
          ),
        );
    }

    if (!masterId || !serviziId || !startTime || !endTime) {
      return res
        .status(400)
        .json(
          formatResponse(
            400,
            "masterId, serviziId, startTime и endTime обязательны",
          ),
        );
    }

    try {
      const booking = await BookingService.create(
        {
          masterId,
          serviziId,
          startTime,
          endTime,
          date: date ?? startTime,
          status: "Ожидает подтверждения",
          clientComment,
        },
        user,
      );

      return res
        .status(201)
        .json(
          formatResponse(
            201,
            "Запись через AI-помощника успешно создана",
            booking,
            null,
          ),
        );
    } catch (error) {
      console.log("==== AiController.createBookingFromAssistant ==== ");
      console.log(error);
      const statusCode = getBookingErrorStatus(error);
      return res
        .status(statusCode)
        .json(
          formatResponse(
            statusCode,
            statusCode === 500
              ? "Ошибка при создании записи через AI-помощника"
              : "Не удалось создать запись через AI-помощника",
            null,
            error.message,
          ),
        );
    }
  }
}

module.exports = AiController;
