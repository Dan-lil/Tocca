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
  static async normalizeDayWindow(masterId, dayOdWeek, preferredId, transaction) {
    const dayRows = await Shadule.findAll({
      where: { masterId, dayOdWeek },
      order: [["id", "ASC"]],
      transaction,
    });

    if (!dayRows.length) {
      return null;
    }

    const keeper =
      dayRows.find((row) => row.id === preferredId) ?? dayRows[0];

    const merged = dayRows.reduce(
      (acc, row) => {
        const startTime = toDate(row.startTime);
        const endTime = toDate(row.endTime);

        if (startTime < acc.startTime) acc.startTime = startTime;
        if (endTime > acc.endTime) acc.endTime = endTime;
        if (row.isWorkingDay) acc.isWorkingDay = true;

        return acc;
      },
      {
        startTime: toDate(keeper.startTime),
        endTime: toDate(keeper.endTime),
        isWorkingDay: Boolean(keeper.isWorkingDay),
      },
    );

    await keeper.update(
      {
        startTime: merged.startTime,
        endTime: merged.endTime,
        isWorkingDay: merged.isWorkingDay,
      },
      { transaction },
    );

    const duplicateIds = dayRows
      .map((row) => row.id)
      .filter((id) => id !== keeper.id);

    if (duplicateIds.length > 0) {
      await Shadule.destroy({
        where: { id: duplicateIds },
        transaction,
      });
    }

    return keeper.get();
  }

  static async create(ShaduleData) {
    assertValidScheduleWindow(ShaduleData.startTime, ShaduleData.endTime);

    const transaction = await Shadule.sequelize.transaction();
    try {
      const newShadule = await Shadule.create(ShaduleData, { transaction });
      const normalized = await this.normalizeDayWindow(
        newShadule.masterId,
        newShadule.dayOdWeek,
        newShadule.id,
        transaction,
      );
      await transaction.commit();
      return normalized;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(id, ShaduleData) {
    if (ShaduleData.startTime && ShaduleData.endTime) {
      assertValidScheduleWindow(ShaduleData.startTime, ShaduleData.endTime);
    }

    const transaction = await Shadule.sequelize.transaction();
    try {
      const [rows] = await Shadule.update(ShaduleData, {
        where: { id: id },
        transaction,
      });

      if (rows === 0) {
        await transaction.rollback();
        return null;
      }

      const shadule = await Shadule.findOne({
        where: { id: id },
        transaction,
      });
      const normalized = await this.normalizeDayWindow(
        shadule.masterId,
        shadule.dayOdWeek,
        shadule.id,
        transaction,
      );

      await transaction.commit();
      return normalized;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
    await Shadule.destroy({ where: { dayOfWeek: dayOfWeek } });
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
