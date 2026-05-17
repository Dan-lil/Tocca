const { Shadule } = require("../db/models");

class ShaduleService {
  static async create(ShaduleData) {
    const newShadule = await Shadule.create(ShaduleData);

    const plainShadule = newShadule.get();

    return plainShadule;
  }

  static async update(id, ShaduleData) {
    const [rows] = await Shadule.update(ShaduleData, {
      where: { id: id },
    });

    if (rows === 0) {
      return null;
    }
    const shadule = await Shadule.findOne({ where: { id: id } });

    const plainShadule = shadule.get();

    return plainShadule;
  }

  static async findAllByMasterId(masterId) {
    const shadules = await Shadule.findAll({ where: { masterId: masterId } });
    return shadules.map((shadule) => shadule.get());
  }

  static async findById(id) {
    const shadule = await Shadule.findByPk(id);
    if (!shadule) {
      return null;
    }
    return shadule.get();
  }

  static async delete(id) {
    await Shadule.destroy({ where: { id: id } });
  }

  static async deleteByMasterId(masterId) {
    await Shadule.destroy({ where: { masterId: masterId } });
  }

  static async deleteByDayOfWeek(dayOfWeek) {
    await Shadule.destroy({ where: { dayOfWeek: dayOfWeek } });
  }

  static async findAll() {
    const shadules = await Shadule.findAll();
    return shadules.map((shadule) => shadule.get());
  }
}

module.exports = ShaduleService;
