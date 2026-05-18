const { Servizi } = require("../db/models");

class ServiziService {
  static async create(ServiziData) {
    const newServizi = await Servizi.create(ServiziData);

    const plainServizi = newServizi.get();

    return plainServizi;
  }

  static async update(id, ServiziData) {
    const [rows] = await Servizi.update(ServiziData, {
      where: { id: id },
    });

    if (rows === 0) {
      return null;
    }
    const servizi = await Servizi.findOne({ where: { id: id } });

    const plainServizi = servizi.get();

    return plainServizi;
  }

  static async findAllByMasterId(masterId) {
    const serviziList = await Servizi.findAll({
      where: { masterId: masterId },
    });

    return serviziList.map((servizi) => servizi.get());
  }

  static async findAllByCategoryId(categoryId) {
    const serviziList = await Servizi.findAll({
      where: { categoryId: categoryId },
    });

    return serviziList.map((servizi) => servizi.get());
  }

  static async findAll() {
    const serviziList = await Servizi.findAll();

    return serviziList.map((servizi) => servizi.get());
  }

  static async findById(id) {
    const servizi = await Servizi.findByPk(id);

    if (!servizi) {
      return null;
    }

    return servizi.get();
  }

  static async findByActive(isActive) {
    const serviziList = await Servizi.findAll({
      where: { isActive: isActive },
    });

    return serviziList.map((servizi) => servizi.get());
  }

  static async delete(id) {
    await Servizi.destroy({ where: { id: id } });
  }

  static async deleteByActive(isActive) {
    await Servizi.destroy({ where: { isActive: isActive } });
  }

  static async deleteByMasterId(masterId) {
    await Servizi.destroy({ where: { masterId: masterId } });
  }
}

module.exports = ServiziService;
