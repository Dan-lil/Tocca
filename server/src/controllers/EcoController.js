const EcoService = require("../services/EcoService");
const formatResponse = require("../utils/formatResponse");

class EcoController {
  static async createReview(req, res) {
    const { user } = res.locals;
    const reviewData = req.body;

    try {
      const createReview = await EcoService.create(user.id, reviewData);
      if (!createReview) {
        return res
          .status(400)
          .json(
            formatResponse(
              400,
              "Не удалось создать отзыв,проверьте правильность данных для создания отзыва",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Отзыв успешно создан!", createReview));
    } catch (error) {
      console.log("======== EcoController.createReview =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при создании отзыва"));
    }
  }

  static async getReviewsByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const reviews = await EcoService.findAllByMasterId(masterId);
      if (!reviews || reviews.length === 0) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Отзывы не найдены,проверьте правильность id мастера",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Отзывы успешно получены!", reviews));
    } catch (error) {
      console.log("======== EcoController.getReviewsByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении отзывов"));
    }
  }

  static async getReviewsByBookingId(req, res) {
    const { bookingId } = req.params;

    try {
      const reviews = await EcoService.findByBookingId(bookingId);
      if (!reviews || reviews.length === 0) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Отзывы не найдены,проверьте правильность id бронирования",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Отзывы успешно получены!", reviews));
    } catch (error) {
      console.log("======== EcoController.getReviewsByBookingId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении отзывов"));
    }
  }
  static async getReviewsByClientId(req, res) {
    const { clientId } = req.params;

    try {
      const reviews = await EcoService.findAllByClientId(clientId);
      if (!reviews || reviews.length === 0) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Отзывы не найдены,проверьте правильность id клиента",
            ),
          );
      }
      return res
        .status(200)
        .json(formatResponse(200, "Отзывы успешно получены!", reviews));
    } catch (error) {
      console.log("======== EcoController.getReviewsByClientId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении отзывов"));
    }
  }
  static async deleteReview(req, res) {
    const { id } = req.params;

    try {
      await EcoService.delete(id);
      return res.status(200).json(formatResponse(200, "Отзыв успешно удален"));
    } catch (error) {
      console.log("======== EcoController.deleteReview =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении отзыва"));
    }
  }
  static async deleteReviewsByBookingId(req, res) {
    const { bookingId } = req.params;

    try {
      await EcoService.deleteByBookingId(bookingId);
      return res
        .status(200)
        .json(formatResponse(200, "Отзывы успешно удалены"));
    } catch (error) {
      console.log("======== EcoController.deleteReviewsByBookingId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении отзывов"));
    }
  }

  static async deleteReviewsByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      await EcoService.deleteByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Отзывы успешно удалены"));
    } catch (error) {
      console.log("======== EcoController.deleteReviewsByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении отзывов"));
    }
  }

  static async deleteReviewsByClientId(req, res) {
    const { clientId } = req.params;

    try {
      await EcoService.deleteByClientId(clientId);
      return res
        .status(200)
        .json(formatResponse(200, "Отзывы успешно удалены"));
    } catch (error) {
      console.log("======== EcoController.deleteReviewsByClientId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении отзывов"));
    }
  }
}

module.exports = EcoController;
