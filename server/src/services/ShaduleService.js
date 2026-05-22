const { Shadule } = require("../db/models");

function toDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Некорректное время в расписании");
  }
  return date;
}

function assertValidScheduleWindow(startTime, endTime) {
  const start = toDate(startTime);
  const end = toDate(endTime);
  if (start >= end) {
    throw new Error("Время окончания должно быть позже времени начала");
  }
}

class ShaduleService {
  static async create(ShaduleData) {
    assertValidScheduleWindow(ShaduleData.startTime, ShaduleData.endTime);

    const newShadule = await Shadule.create(ShaduleData);
    return newShadule.get();
  }

  static async update(id, ShaduleData) {
    if (ShaduleData.startTime && ShaduleData.endTime) {
      assertValidScheduleWindow(ShaduleData.startTime, ShaduleData.endTime);
    }

    const [rows] = await Shadule.update(ShaduleData, {
      where: { id: id },
    });

    if (rows === 0) {
      return null;
    }

    const shadule = await Shadule.findByPk(id);
    return shadule ? shadule.get() : null;
  }

  static async findAllByMasterId(masterId) {
    const shadules = await Shadule.findAll({
      where: { masterId: masterId },
      order: [
        ["dayOdWeek", "ASC"],
        ["startTime", "ASC"],
        ["id", "ASC"],
      ],
    });
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
    await Shadule.destroy({ where: { dayOdWeek: dayOfWeek } });
  }

  static async findAll() {
    const shadules = await Shadule.findAll({
      order: [
        ["masterId", "ASC"],
        ["dayOdWeek", "ASC"],
        ["startTime", "ASC"],
        ["id", "ASC"],
      ],
    });
    return shadules.map((shadule) => shadule.get());
  }
}

module.exports = ShaduleService;
