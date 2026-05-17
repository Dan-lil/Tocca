const { Sale } = require("../db/models");
const { Op } = require("sequelize");

class SaleService {
  static async findById(id) {
    return await Sale.findByPk(id);
  }

  static async findAll() {
    return await Sale.findAll();
  }

  static async findByMasterId(masterId) {
    return await Sale.findAll({ where: { masterId } });
  }

  static async findByServiziId(serviziId) {
    return await Sale.findAll({ where: { serviziId } });
  }

  static async findByDiscountRange(minDiscount, maxDiscount) {
    return await Sale.findAll({
      where: {
        discount: {
          [Op.between]: [minDiscount, maxDiscount],
        },
      },
    });
  }

  static async findByDateRange(startDate, endDate) {
    return await Sale.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
  }

  static async findByDate(date) {
    return await Sale.findAll({
      where: {
        date: {
          [Op.eq]: date,
        },
      },
    });
  }

  static async create(saleData) {
    const newSale = await Sale.create(saleData);

    const plainSale = newSale.get();

    return plainSale;
  }

  static async update(id, saleData) {
    const [rows] = await Sale.update(saleData, {
      where: { id: id },
    });

    if (rows === 0) {
      return null;
    }
    const sale = await Sale.findOne({ where: { id: id } });

    const plainSale = sale.get();

    return plainSale;
  }

  static async delete(id) {
    await Sale.destroy({ where: { id: id } });
  }

  static async deleteByMasterId(masterId) {
    await Sale.destroy({ where: { masterId: masterId } });
  }

  static async deleteByServiziId(serviziId) {
    await Sale.destroy({ where: { serviziId: serviziId } });
  }

  static async deleteByDate(date) {
    await Sale.destroy({ where: { date: date } });
  }
}

module.exports = SaleService;
