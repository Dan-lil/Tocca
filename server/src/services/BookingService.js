const { Op } = require("sequelize");
const { Booking, Servizi, User } = require("../db/models");

class BookingService {
  static async enrichBookings(bookings) {
    const plainBookings = bookings
      .filter(Boolean)
      .map((booking) =>
        typeof booking.get === "function" ? booking.get({ plain: true }) : booking,
      );

    const clientIds = [...new Set(plainBookings.map((booking) => booking.clientId).filter(Boolean))];
    const serviceIds = [...new Set(plainBookings.map((booking) => booking.serviziId).filter(Boolean))];

    const [clients, services] = await Promise.all([
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
    ]);

    const clientsById = new Map(
      clients.map((client) => [client.id, client.get({ plain: true })]),
    );
    const servicesById = new Map(
      services.map((service) => [service.id, service.get({ plain: true })]),
    );

    return plainBookings.map((booking) => {
      const client = clientsById.get(booking.clientId);
      const service = servicesById.get(booking.serviziId);

      return {
        ...booking,
        client: {
          name: client?.name ?? "",
          phone: client?.phone ?? "",
        },
        service: service ?? null,
        totalPrice: Number(service?.price) || 0,
      };
    });
  }

  static async enrichBooking(booking) {
    const [enrichedBooking] = await BookingService.enrichBookings([booking]);
    return enrichedBooking ?? null;
  }

  static async create(BookingData) {
    const newBooking = await Booking.create(BookingData);

    return BookingService.enrichBooking(newBooking);
  }
    static async update(id, BookingData) {
    const [rows] = await Booking.update(BookingData, {
      where: { id: id },
    });
    if (rows === 0) {
      return null;
    }
    const booking = await Booking.findByPk(id);

    return BookingService.enrichBooking(booking);
  }

    static async findAllByMasterId(masterId) {
      const bookings = await Booking.findAll({
        where: { masterId: masterId },
        order: [["startTime", "ASC"]],
      });
      return BookingService.enrichBookings(bookings);
    }

    static async findAllByClientId(clientId) {
        const bookings = await Booking.findAll({
            where: { clientId: clientId },
            order: [["startTime", "ASC"]],
        });
        return BookingService.enrichBookings(bookings);
    }

    static async findUpcomingByClientId(clientId) {
        const bookings = await Booking.findAll({
            where: {
                clientId: clientId,
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
                clientId: clientId,
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
