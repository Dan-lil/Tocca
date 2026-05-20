const { Op } = require("sequelize");
const { Booking, Chat, Servizi, User, sequelize } = require("../db/models");

function isCanceledStatus(status) {
  return String(status ?? "")
    .toLowerCase()
    .includes("отмен");
}

function toDate(value, fieldName) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Некорректное значение поля ${fieldName}`);
  }

  return date;
}

class BookingService {
  static async create(bookingData, currentUser = null) {
    const clientId =
      currentUser?.role === "client" ? currentUser.id : bookingData.clientId;

    if (!clientId) {
      throw new Error("Не удалось определить клиента для записи");
    }

    const masterId = Number.parseInt(bookingData.masterId, 10);
    const serviziId = Number.parseInt(bookingData.serviziId, 10);
    const startTime = toDate(bookingData.startTime, "startTime");
    const endTime = toDate(bookingData.endTime, "endTime");
    const date = bookingData.date
      ? toDate(bookingData.date, "date")
      : new Date(startTime);

    if (!masterId || !serviziId) {
      throw new Error("masterId и serviziId обязательны");
    }

    if (startTime >= endTime) {
      throw new Error("Время окончания должно быть позже времени начала");
    }

    const [client, master, service] = await Promise.all([
      User.findByPk(clientId),
      User.findByPk(masterId),
      Servizi.findByPk(serviziId),
    ]);

    if (!client) {
      throw new Error("Клиент не найден");
    }

    if (!master || master.role !== "master") {
      throw new Error("Мастер не найден");
    }

    if (!service) {
      throw new Error("Услуга не найдена");
    }

    if (service.masterId !== masterId) {
      throw new Error("Выбранная услуга не принадлежит мастеру");
    }

    if (service.isActive === false) {
      throw new Error("Услуга сейчас недоступна для записи");
    }

    const conflictingBooking = await Booking.findOne({
      where: {
        masterId,
        status: {
          [Op.notILike]: "%отмен%",
        },
        startTime: {
          [Op.lt]: endTime,
        },
        endTime: {
          [Op.gt]: startTime,
        },
      },
    });

    if (conflictingBooking) {
      throw new Error("Это время уже занято, выберите другой слот");
    }

    const transaction = await sequelize.transaction();

    try {
      const newBooking = await Booking.create(
        {
          clientId,
          masterId,
          serviziId,
          date,
          startTime,
          endTime,
          status: bookingData.status ?? "Ожидает подтверждения",
          clientComment: bookingData.clientComment ?? null,
          cancelReason: bookingData.cancelReason,
        },
        { transaction },
      );

      const chat = await Chat.create(
        {
          clientId,
          masterId,
          bookingId: newBooking.id,
        },
        { transaction },
      );

      await transaction.commit();

      const plainBooking = newBooking.get();

      return {
        ...plainBooking,
        chatId: chat.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(id, BookingData) {
    const [rows] = await Booking.update(BookingData, {
      where: { id: id },
    });
    if (rows === 0) {
      return null;
    }
    const booking = await Booking.findByPk(id);

    return booking.get();
  }

  static async findAllByMasterId(masterId) {
    const bookings = await Booking.findAll({
      where: { masterId: masterId },
    });
    return bookings;
  }

  static async findAllByClientId(clientId) {
    const bookings = await Booking.findAll({
      where: { clientId: clientId },
    });
    return bookings;
  }

  static async findById(id) {
    const booking = await Booking.findByPk(id);
    if (!booking) {
      return null;
    }
    return booking.get();
  }

  static async delete(id) {
    await Booking.destroy({ where: { id: id } });
  }

  static async deleteByMasterId(masterId) {
    await Booking.destroy({ where: { masterId: masterId } });
  }

  static async deleteByClientId(clientId) {
    await Booking.destroy({ where: { clientId: clientId } });
  }
}

module.exports = BookingService;
