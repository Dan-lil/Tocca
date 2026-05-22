const { Eco, Servizi, User } = require("../db/models");
const { withAutoServiceEnglish } = require("../utils/translate");

// Подтягиваем автора услуги, чтобы сразу отдавать имя мастера
const SERVICE_INCLUDE = [
  {
    model: User,
    attributes: ["id", "name"],
  },
];

function getAverageRating(ratings) {
  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);

  return Number((total / ratings.length).toFixed(1));
}

async function getRatingsByMasterId(masterIds) {
  const uniqueMasterIds = [...new Set(masterIds.filter(Boolean))];

  if (!uniqueMasterIds.length) {
    return new Map();
  }

  const reviews = await Eco.findAll({
    where: { masterId: uniqueMasterIds },
    attributes: ["masterId", "rating"],
  });
  const ratings = new Map();

  reviews.forEach((review) => {
    const plainReview = review.get({ plain: true });
    const rating = Number(plainReview.rating) || 0;
    const currentRatings = ratings.get(plainReview.masterId) ?? [];

    ratings.set(plainReview.masterId, [...currentRatings, rating]);
  });

  return new Map(
    [...ratings.entries()].map(([masterId, masterRatings]) => [
      masterId,
      getAverageRating(masterRatings),
    ]),
  );
}

function mapServizi(servizi, ratingsByMasterId = new Map()) {
  const plainServizi = servizi.get({ plain: true });
  const calculatedRating = ratingsByMasterId.get(plainServizi.masterId);

  return {
    ...plainServizi,
    // Нормализуем вложенные данные Sequelize, удобную для клиента
    masterName: plainServizi.User?.name ?? null,
    masterRating: calculatedRating ?? 0,
  };
}

async function mapServiziList(serviziList) {
  const ratingsByMasterId = await getRatingsByMasterId(
    serviziList.map((servizi) => servizi.masterId),
  );

  return serviziList.map((servizi) => mapServizi(servizi, ratingsByMasterId));
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

    return mapServiziList(serviziList);
  }

  static async findAllByCategoryId(categoryId) {
    const serviziList = await Servizi.findAll({
      where: { categoryId: categoryId },
      include: SERVICE_INCLUDE,
    });

    return mapServiziList(serviziList);
  }

  static async findAll() {
    const serviziList = await Servizi.findAll({
      include: SERVICE_INCLUDE,
    });

    return mapServiziList(serviziList);
  }

  static async findById(id) {
    const servizi = await Servizi.findByPk(id, {
      include: SERVICE_INCLUDE,
    });

    if (!servizi) {
      return null;
    }

    const ratingsByMasterId = await getRatingsByMasterId([servizi.masterId]);

    return mapServizi(servizi, ratingsByMasterId);
  }

  static async findByActive(isActive) {
    const serviziList = await Servizi.findAll({
      where: { isActive: isActive },
      include: SERVICE_INCLUDE,
    });

    return mapServiziList(serviziList);
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
