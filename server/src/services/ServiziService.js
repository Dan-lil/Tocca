const { ProfileMaster, Servizi, User } = require("../db/models");
const { withAutoServiceEnglish } = require("../utils/translate");

// Подтягиваем автора услуги и его профиль, чтобы сразу отдавать имя и рейтинг мастера
const SERVICE_INCLUDE = [
  {
    model: User,
    attributes: ["id", "name"],
    include: [
      {
        model: ProfileMaster,
        attributes: ["rating"],
      },
    ],
  },
];

function mapServizi(servizi) {
  const plainServizi = servizi.get({ plain: true });

  return {
    ...plainServizi,
    // Нормализуем вложенные данные Sequelize, удобную для клиента
    masterName: plainServizi.User?.name ?? null,
    masterRating: plainServizi.User?.ProfileMaster?.rating ?? 0,
  };
}

class ServiziService {
  static async create(ServiziData) {
    const serviziData = await withAutoServiceEnglish(ServiziData);
    const newServizi = await Servizi.create(serviziData);

    const plainServizi = newServizi.get();

    return plainServizi;
  }

  static async update(id, ServiziData) {
    const serviziData = await withAutoServiceEnglish(ServiziData);
    const [rows] = await Servizi.update(serviziData, {
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
      include: SERVICE_INCLUDE,
    });

    return serviziList.map(mapServizi);
  }

  static async findAllByCategoryId(categoryId) {
    const serviziList = await Servizi.findAll({
      where: { categoryId: categoryId },
      include: SERVICE_INCLUDE,
    });

    return serviziList.map(mapServizi);
  }

  static async findAll() {
    const serviziList = await Servizi.findAll({
      include: SERVICE_INCLUDE,
    });

    return serviziList.map(mapServizi);
  }

  static async findById(id) {
    const servizi = await Servizi.findByPk(id, {
      include: SERVICE_INCLUDE,
    });

    if (!servizi) {
      return null;
    }

    return mapServizi(servizi);
  }

  static async findByActive(isActive) {
    const serviziList = await Servizi.findAll({
      where: { isActive: isActive },
      include: SERVICE_INCLUDE,
    });

    return serviziList.map(mapServizi);
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
