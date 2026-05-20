const { Op } = require("sequelize");
const { Booking } = require("../db/models");

class BookingService {
  static async create(BookingData) {
    const newBooking = await Booking.create(BookingData);

    const plainBooking = newBooking.get();

    return plainBooking;
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
        return bookings;
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
