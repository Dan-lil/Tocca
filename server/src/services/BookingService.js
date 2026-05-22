const { Op } = require("sequelize");
const { Booking, Chat, Sale, Servizi, User, sequelize } = require("../db/models");

function isCanceledStatus(status) {
  const normalizedStatus = String(status ?? "").toLowerCase();

  return (
    normalizedStatus.includes("отмен") ||
    normalizedStatus.includes("cancel") ||
    normalizedStatus.includes("РѕС‚РјРµРЅ")
  );
}

function isDoneStatus(status) {
  const normalizedStatus = String(status ?? "").toLowerCase();

  return (
    normalizedStatus.includes("заверш") ||
    normalizedStatus.includes("done") ||
    normalizedStatus.includes("completed") ||
    normalizedStatus.includes("Р·Р°РІРµСЂС€")
  );
}

function toDate(value, fieldName) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Некорректное значение поля ${fieldName}`);
  }

  return date;
}

class BookingService {
  static async enrichBookings(bookings) {
    const plainBookings = bookings
      .filter(Boolean)
      .map((booking) =>
        typeof booking.get === "function" ? booking.get({ plain: true }) : booking,
      );

    const clientIds = [
      ...new Set(plainBookings.map((booking) => booking.clientId).filter(Boolean)),
    ];
    const serviceIds = [
      ...new Set(plainBookings.map((booking) => booking.serviziId).filter(Boolean)),
    ];
    const bookingIds = [
      ...new Set(plainBookings.map((booking) => booking.id).filter(Boolean)),
    ];

    const [clients, services, sales] = await Promise.all([
      clientIds.length
        ? User.findAll({
            where: { id: { [Op.in]: clientIds } },
            attributes: ["id", "name", "phone"],
          })
        : [],
      serviceIds.length
        ? Servizi.findAll({
            where: { id: { [Op.in]: serviceIds } },
          })
        : [],
      bookingIds.length
        ? Sale.findAll({
            where: { bookingId: { [Op.in]: bookingIds } },
          })
        : [],
    ]);

    const clientsById = new Map(
      clients.map((client) => [client.id, client.get({ plain: true })]),
    );
    const servicesById = new Map(
      services.map((service) => [service.id, service.get({ plain: true })]),
    );
    const salesByBookingId = new Map(
      sales.map((sale) => [sale.bookingId, sale.get({ plain: true })]),
    );

    return plainBookings.map((booking) => {
      const client = clientsById.get(booking.clientId);
      const service = servicesById.get(booking.serviziId);
      const sale = salesByBookingId.get(booking.id);
      const totalPrice = Number(sale?.finalPrice ?? service?.price) || 0;

      return {
        ...booking,
        client: {
          name: client?.name ?? "",
          phone: client?.phone ?? "",
        },
        service: service ?? null,
        sale: sale ?? null,
        totalPrice,
      };
    });
  }

  static async enrichBooking(booking) {
    const [enrichedBooking] = await BookingService.enrichBookings([booking]);
    return enrichedBooking ?? null;
  }

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

    const overlappingBookings = await Booking.findAll({
      where: {
        masterId,
        startTime: {
          [Op.lt]: endTime,
        },
        endTime: {
          [Op.gt]: startTime,
        },
      },
    });

    const conflictingBooking = overlappingBookings.find(
      (booking) => !isCanceledStatus(booking.status),
    );

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

      const [chat] = await Chat.findOrCreate({
        where: {
          clientId,
          masterId,
        },
        defaults: {
          clientId,
          masterId,
          bookingId: newBooking.id,
        },
        transaction,
      });

      if (chat.bookingId !== newBooking.id) {
        await chat.update(
          {
            bookingId: newBooking.id,
            updatedAt: new Date(),
          },
          { transaction },
        );
      }

      await transaction.commit();

      const enrichedBooking = await BookingService.enrichBooking(newBooking);

      return {
        ...enrichedBooking,
        chatId: chat.id,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(id, bookingData) {
    const { finalPrice, actualPrice, ...bookingPatch } = bookingData;
    const [rows] = await Booking.update(bookingPatch, { where: { id } });

    if (rows === 0) {
      return null;
    }

    const booking = await Booking.findByPk(id);
    const plainBooking = booking?.get({ plain: true });
    const price = Number(finalPrice ?? actualPrice);

    if (plainBooking) {
      if (isDoneStatus(plainBooking.status) && Number.isFinite(price) && price >= 0) {
        const existingSale = await Sale.findOne({ where: { bookingId: plainBooking.id } });
        const saleData = {
          masterId: plainBooking.masterId,
          bookingId: plainBooking.id,
          serviziId: plainBooking.serviziId,
          finalPrice: price,
          discount: 0,
          date: plainBooking.date ?? plainBooking.startTime,
        };

        if (existingSale) {
          await existingSale.update(saleData);
        } else {
          await Sale.create(saleData);
        }
      } else if (Object.hasOwn(bookingPatch, "status") && !isDoneStatus(plainBooking.status)) {
        await Sale.destroy({ where: { bookingId: plainBooking.id } });
      }
    }

    return BookingService.enrichBooking(booking);
  }

  static async findAllByMasterId(masterId) {
    const bookings = await Booking.findAll({
      where: { masterId },
      order: [["startTime", "ASC"]],
    });

    return BookingService.enrichBookings(bookings);
  }

  static async findAllByClientId(clientId) {
    const bookings = await Booking.findAll({
      where: { clientId },
      order: [["startTime", "ASC"]],
    });

    return BookingService.enrichBookings(bookings);
  }

  static async findUpcomingByClientId(clientId) {
    const bookings = await Booking.findAll({
      where: {
        clientId,
        endTime: {
          [Op.gte]: new Date(),
        },
      },
      order: [["startTime", "ASC"]],
    });

    return BookingService.enrichBookings(bookings);
  }

  static async findPastByClientId(clientId) {
    const bookings = await Booking.findAll({
      where: {
        clientId,
        endTime: {
          [Op.lt]: new Date(),
        },
      },
      order: [["startTime", "DESC"]],
    });

    return BookingService.enrichBookings(bookings);
  }

  static async findById(id) {
    const booking = await Booking.findByPk(id);

    if (!booking) {
      return null;
    }

    return BookingService.enrichBooking(booking);
  }

  static async delete(id) {
    await Booking.destroy({ where: { id } });
  }

  static async deleteByMasterId(masterId) {
    await Booking.destroy({ where: { masterId } });
  }

  static async deleteByClientId(clientId) {
    await Booking.destroy({ where: { clientId } });
  }
}

module.exports = BookingService;
