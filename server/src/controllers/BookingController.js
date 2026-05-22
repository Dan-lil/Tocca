const BookingService = require("../services/BookingService");
const formatResponse = require("../utils/formatResponse");
const { userRoomName } = require("../ws/chatSocket");

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

class BookingController {
  static async create(req, res) {
    const bookingData = req.body;
    const { user } = res.locals;

    try {
      const newBooking = await BookingService.create(bookingData, user);
      return res
        .status(201)
        .json(formatResponse(201, "Бронирование успешно создано!", newBooking));
    } catch (error) {
      console.log("======== BookingController.create =========");
      console.log(error);
      const statusCode = getBookingErrorStatus(error);
      return res
        .status(statusCode)
        .json(
          formatResponse(
            statusCode,
            statusCode === 500
              ? "Ошибка сервера при создании бронирования"
              : "Не удалось создать бронирование",
            null,
            error.message,
          ),
        );
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const bookingData = req.body;

    try {
      const updatedBooking = await BookingService.update(id, bookingData);
      if (!updatedBooking) {
        return res
          .status(404)
          .json(
            formatResponse(
              404,
              "Бронирование не удалось обновить, бронирование для обновления не найдено.",
            ),
          );
      }
      const io = req.app.get("io");

      if (io) {
        io.to(userRoomName(updatedBooking.clientId)).emit("booking:updated", updatedBooking);
        io.to(userRoomName(updatedBooking.masterId)).emit("booking:updated", updatedBooking);
      }

      return res
        .status(200)
        .json(
          formatResponse(
            200,
            "Бронирование успешно обновлено!",
            updatedBooking,
          ),
        );
    } catch (error) {
      console.log("======== BookingController.update =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при обновлении бронирования"),
        );
    }
  }

  static async delete(req, res) {
    const { id } = req.params;
    const { user } = res.locals;

   

    try {
      await BookingService.delete(id);
      return res
        .status(200)
        .json(formatResponse(200, "Бронирование успешно удалено!"));
    } catch (error) {
      console.log("======== BookingController.delete =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении бронирования"));
    }
  }

  static async findById(req, res) {
    const { id } = req.params;

    try {
      const booking = await BookingService.findById(id);
      if (!booking) {
        return res
          .status(404)
          .json(formatResponse(404, "Бронирование не найдено"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Бронирование успешно получено!", booking));
    } catch (error) {
      console.log("======== BookingController.findById =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении бронирования"));
    }
  }
  static async findAllByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const bookings = await BookingService.findAllByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Бронирования успешно получены!", bookings));
    } catch (error) {
      console.log("======== BookingController.findAllByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении бронирований"));
    }
  }

  static async findAllByClientId(req, res) {
    const { clientId } = req.params;

    try {
      const bookings = await BookingService.findAllByClientId(clientId);
      return res
        .status(200)
        .json(formatResponse(200, "Бронирования успешно получены!", bookings));
    } catch (error) {
      console.log("======== BookingController.findAllByClientId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при получении бронирований"));
    }
  }

  static async findUpcomingByCurrentClient(req, res) {
    const { user } = res.locals;

    try {
      const bookings = await BookingService.findUpcomingByClientId(user.id);
      return res
        .status(200)
        .json(formatResponse(200, "Р‘Р»РёР¶Р°Р№С€РёРµ Р·Р°РїРёСЃРё СѓСЃРїРµС€РЅРѕ РїРѕР»СѓС‡РµРЅС‹!", bookings));
    } catch (error) {
      console.log("======== BookingController.findUpcomingByCurrentClient =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё Р±Р»РёР¶Р°Р№С€РёС… Р·Р°РїРёСЃРµР№"));
    }
  }

  static async findPastByCurrentClient(req, res) {
    const { user } = res.locals;

    try {
      const bookings = await BookingService.findPastByClientId(user.id);
      return res
        .status(200)
        .json(formatResponse(200, "РџСЂРѕС€РµРґС€РёРµ Р·Р°РїРёСЃРё СѓСЃРїРµС€РЅРѕ РїРѕР»СѓС‡РµРЅС‹!", bookings));
    } catch (error) {
      console.log("======== BookingController.findPastByCurrentClient =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё РїСЂРѕС€РµРґС€РёС… Р·Р°РїРёСЃРµР№"));
    }
  }

  static async cancelCurrentClientBooking(req, res) {
    const { id } = req.params;
    const cancelReason =
      req.body?.cancelReason?.defaultValue ||
      req.body?.cancelReason ||
      "РћС‚РјРµРЅРµРЅРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»РµРј";

    try {
      const updatedBooking = await BookingService.update(id, {
        status: "cancelled",
        cancelReason,
      });

      if (!updatedBooking) {
        return res
          .status(404)
          .json(formatResponse(404, "Р—Р°РїРёСЃСЊ РґР»СЏ РѕС‚РјРµРЅС‹ РЅРµ РЅР°Р№РґРµРЅР°"));
      }

      return res
        .status(200)
        .json(formatResponse(200, "Р—Р°РїРёСЃСЊ СѓСЃРїРµС€РЅРѕ РѕС‚РјРµРЅРµРЅР°", updatedBooking));
    } catch (error) {
      console.log("======== BookingController.cancelCurrentClientBooking =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РїСЂРё РѕС‚РјРµРЅРµ Р·Р°РїРёСЃРё"));
    }
  }

  static async deleteByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      await BookingService.deleteByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Бронирования успешно удалены!"));
    } catch (error) {
      console.log("======== BookingController.deleteByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении бронирований"));
    }
  }

  static async deleteByClientId(req, res) {
    const { clientId } = req.params;

    try {
      await BookingService.deleteByClientId(clientId);
      return res
        .status(200)
        .json(formatResponse(200, "Бронирования успешно удалены!"));
    } catch (error) {
      console.log("======== BookingController.deleteByClientId =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении бронирований"));
    }
  }
}

module.exports = BookingController;
