const path = require("path");
const SaleService = require("../services/SaleService");
const formatResponse = require("../utils/formatResponse");
const { optimizeImageFile } = require("../utils/imageOptimizer");

async function saveSaleImage(imageFile) {
  return optimizeImageFile({
    imageFile,
    label: "sale image",
    outputDir: path.join(__dirname, "../public/uploads/sales"),
    preset: "promotion",
    publicDir: "/uploads/sales",
  });
}

class SaleController {
  static async create(req, res) {
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }

    try {
      const { imageFile, ...salePayload } = req.body;
      const uploadedImageUrl = await saveSaleImage(imageFile);
      const saleData = { ...salePayload };

      if (uploadedImageUrl) {
        saleData.image = uploadedImageUrl;
      }

      const newSale = await SaleService.create(saleData);
      return res
        .status(201)
        .json(formatResponse(201, "Продажа успешно создана!", newSale));
    } catch (error) {
      console.log("======== SaleController.create =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при создании продажи"));
    }
  }

  static async findById(req, res) {
    const { id } = req.params;

    try {
      const sale = await SaleService.findById(id);
      if (!sale) {
        return res.status(404).json(formatResponse(404, "Продажа не найдена"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Продажа успешно найдена!", sale));
    } catch (error) {
      console.log("======== SaleController.findById =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при поиске продажи"));
    }
  }

  static async findAll(req, res) {
    try {
      const sales = await SaleService.findAll();
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно найдены!", sales));
    } catch (error) {
      console.log("======== SaleController.findAll =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при поиске продаж"));
    }
  }

  static async findForClient(req, res) {
    try {
      const sales = await SaleService.findForClient();
      return res
        .status(200)
        .json(formatResponse(200, "РђРєС†РёРё РґР»СЏ РєР»РёРµРЅС‚Р° СѓСЃРїРµС€РЅРѕ РЅР°Р№РґРµРЅС‹!", sales));
    } catch (error) {
      console.log("======== SaleController.findForClient =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "РћС€РёР±РєР° СЃРµСЂРІРµСЂР° РїСЂРё РїРѕРёСЃРєРµ Р°РєС†РёР№ РґР»СЏ РєР»РёРµРЅС‚Р°"));
    }
  }

  static async findByMasterId(req, res) {
    const { masterId } = req.params;

    try {
      const sales = await SaleService.findByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно найдены!", sales));
    } catch (error) {
      console.log("======== SaleController.findByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при поиске продаж по мастеру"),
        );
    }
  }

  static async findByServiziId(req, res) {
    const { serviziId } = req.params;

    try {
      const sales = await SaleService.findByServiziId(serviziId);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно найдены!", sales));
    } catch (error) {
      console.log("======== SaleController.findByServiziId =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при поиске продаж по сервису"),
        );
    }
  }

  static async findByDiscountRange(req, res) {
    const { minDiscount, maxDiscount } = req.query;

    try {
      const sales = await SaleService.findByDiscountRange(
        minDiscount,
        maxDiscount,
      );
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно найдены!", sales));
    } catch (error) {
      console.log("======== SaleController.findByDiscountRange =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при поиске продаж по диапазону скидки",
          ),
        );
    }
  }

  static async findByDateRange(req, res) {
    const { startDate, endDate } = req.query;

    try {
      const sales = await SaleService.findByDateRange(startDate, endDate);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно найдены!", sales));
    } catch (error) {
      console.log("======== SaleController.findByDateRange =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(
            500,
            "Ошибка сервера при поиске продаж по диапазону дат",
          ),
        );
    }
  }

  static async findByDate(req, res) {
    const { date } = req.query;

    try {
      const sales = await SaleService.findByDate(date);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно найдены!", sales));
    } catch (error) {
      console.log("======== SaleController.findByDate =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при поиске продаж по дате"));
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }

    try {
      const { imageFile, ...salePayload } = req.body;
      const uploadedImageUrl = await saveSaleImage(imageFile);
      const saleData = { ...salePayload };

      if (uploadedImageUrl) {
        saleData.image = uploadedImageUrl;
      }

      const updatedSale = await SaleService.update(id, saleData);
      if (!updatedSale) {
        return res
          .status(404)
          .json(formatResponse(404, "Продажа не найдена для обновления"));
      }
      return res
        .status(200)
        .json(formatResponse(200, "Продажа успешно обновлена!", updatedSale));
    } catch (error) {
      console.log("======== SaleController.update =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при обновлении продажи"));
    }
  }

  static async delete(req, res) {
    const { id } = req.params;
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }

    try {
      await SaleService.delete(id);
      return res
        .status(200)
        .json(formatResponse(200, "Продажа успешно удалена!"));
    } catch (error) {
      console.log("======== SaleController.delete =========");
      console.log(error);
      return res
        .status(500)
        .json(formatResponse(500, "Ошибка сервера при удалении продажи"));
    }
  }

  static async deleteByMasterId(req, res) {
    const { masterId } = req.params;
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }

    try {
      await SaleService.deleteByMasterId(masterId);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно удалены!"));
    } catch (error) {
      console.log("======== SaleController.deleteByMasterId =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при удалении продаж по мастеру"),
        );
    }
  }

  static async deleteByServiziId(req, res) {
    const { serviziId } = req.params;
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }

    try {
      await SaleService.deleteByServiziId(serviziId);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно удалены!"));
    } catch (error) {
      console.log("======== SaleController.deleteByServiziId =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при удалении продаж по сервису"),
        );
    }
  }

  static async deleteByDate(req, res) {
    const { date } = req.query;
    const { user } = res.locals;

    if (user.role === "client") {
      return res
        .status(401)
        .json(
          formatResponse(
            401,
            "У вас недостаточно прав для выполнение операции,смените роль и попробуйте совершить попытку снова.",
          ),
        );
    }

    try {
      await SaleService.deleteByDate(date);
      return res
        .status(200)
        .json(formatResponse(200, "Продажи успешно удалены!"));
    } catch (error) {
      console.log("======== SaleController.deleteByDate =========");
      console.log(error);
      return res
        .status(500)
        .json(
          formatResponse(500, "Ошибка сервера при удалении продаж по дате"),
        );
    }
  }
}

module.exports = SaleController;
