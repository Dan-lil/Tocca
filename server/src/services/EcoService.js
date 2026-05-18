const { Eco } = require("../db/models");

class EcoService {
  static async create(EcoData) {
    const newEco = await Eco.create(EcoData);

    const plainEco = newEco.get();

    return plainEco;
  }

  static async findByBookingId(bookingId) {
    const eco = await Eco.findOne({ where: { bookingId } });
    return eco ? eco.get() : null;
  }

  static async findAllByMasterId(masterId) {
    const ecos = await Eco.findAll({ where: { masterId } });
    return ecos.map((eco) => eco.get());
  }

  static async findAllByClientId(clientId) {
    const ecos = await Eco.findAll({ where: { clientId } });
    return ecos.map((eco) => eco.get());
  }

  static async deleteByBookingId(bookingId) {
    await Eco.destroy({ where: { bookingId: bookingId } });
  }

  static async deleteByMasterId(masterId) {
    await Eco.destroy({ where: { masterId: masterId } });
  }

  static async deleteByClientId(clientId) {
    await Eco.destroy({ where: { clientId: clientId } });
  }
  static async delete(id) {
    await Eco.destroy({ where: { id: id } });
  }
}

module.exports = EcoService;
