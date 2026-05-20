const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { Op } = require("sequelize");
const { Booking, MasterPortfolio, ProfileMaster, Servizi, User } = require("../db/models");
const formatResponse = require("../utils/formatResponse");

function getMasterId(res) {
  return res.locals.user?.id;
}

function mapPortfolioItem(item) {
  return {
    id: String(item.id),
    imageUrl: item.portfolioImages,
    title: item.text,
  };
}

async function savePortfolioImage(imageFile) {
  if (!imageFile?.data || !imageFile?.type) {
    return null;
  }

  if (!imageFile.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const [, base64Data] = imageFile.data.split(",");

  if (!base64Data) {
    throw new Error("Invalid image payload");
  }

  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const extension = extensionByType[imageFile.type] ?? "jpg";
  const uploadsDir = path.join(__dirname, "../public/uploads/portfolio");
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, fileName), Buffer.from(base64Data, "base64"));

  return `/uploads/portfolio/${fileName}`;
}

class MasterController {
  static async stats(req, res) {
    const masterId = getMasterId(res);

    try {
      const [totalBookings, activeServices, portfolioCount, profile] = await Promise.all([
        Booking.count({ where: { masterId } }),
        Servizi.count({ where: { masterId, isActive: true } }),
        MasterPortfolio.count({ where: { userId: masterId } }),
        ProfileMaster.findOne({ where: { userId: masterId } }),
      ]);

      return res.status(200).json(
        formatResponse(200, "Master stats loaded", {
          totalBookings,
          rating: profile?.rating ?? 0,
          activeServices,
          portfolioCount,
        }),
      );
    } catch (error) {
      console.log("======== MasterController.stats =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load master stats"));
    }
  }

  static async earnings(req, res) {
    const masterId = getMasterId(res);

    try {
      const bookings = await Booking.findAll({
        where: { masterId },
        attributes: ["serviziId"],
      });
      const serviziIds = [...new Set(bookings.map((booking) => booking.serviziId).filter(Boolean))];
      const services = serviziIds.length
        ? await Servizi.findAll({
            where: { id: { [Op.in]: serviziIds } },
            attributes: ["id", "price"],
          })
        : [];
      const priceById = new Map(services.map((service) => [service.id, Number(service.price) || 0]));
      const total = bookings.reduce((sum, booking) => sum + (priceById.get(booking.serviziId) ?? 0), 0);

      return res.status(200).json(formatResponse(200, "Master earnings loaded", { total }));
    } catch (error) {
      console.log("======== MasterController.earnings =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load master earnings"));
    }
  }

  static async services(req, res) {
    const masterId = getMasterId(res);

    try {
      const services = await Servizi.findAll({
        where: { masterId },
        order: [["id", "ASC"]],
      });

      return res.status(200).json(formatResponse(200, "Master services loaded", services));
    } catch (error) {
      console.log("======== MasterController.services =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load master services"));
    }
  }

  static async createService(req, res) {
    const masterId = getMasterId(res);

    try {
      const service = await Servizi.create({
        ...req.body,
        masterId,
        isActive: req.body.isActive ?? true,
      });

      return res.status(201).json(formatResponse(201, "Service created", service.get()));
    } catch (error) {
      console.log("======== MasterController.createService =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to create service"));
    }
  }

  static async updateService(req, res) {
    const masterId = getMasterId(res);
    const { id } = req.params;

    try {
      const [rows] = await Servizi.update(req.body, { where: { id, masterId } });
      if (rows === 0) {
        return res.status(404).json(formatResponse(404, "Service not found"));
      }

      const service = await Servizi.findOne({ where: { id, masterId } });
      return res.status(200).json(formatResponse(200, "Service updated", service.get()));
    } catch (error) {
      console.log("======== MasterController.updateService =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to update service"));
    }
  }

  static async deleteService(req, res) {
    const masterId = getMasterId(res);
    const { id } = req.params;

    try {
      const deleted = await Servizi.destroy({ where: { id, masterId } });
      if (!deleted) {
        return res.status(404).json(formatResponse(404, "Service not found"));
      }

      return res.status(200).json(formatResponse(200, "Service deleted"));
    } catch (error) {
      console.log("======== MasterController.deleteService =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to delete service"));
    }
  }

  static async portfolio(req, res) {
    const masterId = getMasterId(res);

    try {
      const portfolio = await MasterPortfolio.findAll({
        where: { userId: masterId },
        order: [["id", "DESC"]],
      });

      return res.status(200).json(
        formatResponse(200, "Master portfolio loaded", portfolio.map((item) => mapPortfolioItem(item))),
      );
    } catch (error) {
      console.log("======== MasterController.portfolio =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load portfolio"));
    }
  }

  static async createPortfolio(req, res) {
    const masterId = getMasterId(res);
    const { imageFile, imageUrl, portfolioImages, title, text } = req.body;

    try {
      const uploadedImageUrl = await savePortfolioImage(imageFile);
      const finalImageUrl = uploadedImageUrl ?? imageUrl ?? portfolioImages;

      if (!finalImageUrl) {
        return res.status(400).json(formatResponse(400, "Image is required"));
      }

      const item = await MasterPortfolio.create({
        userId: masterId,
        portfolioImages: finalImageUrl,
        text: title ?? text,
      });

      return res.status(201).json(formatResponse(201, "Portfolio item created", mapPortfolioItem(item)));
    } catch (error) {
      console.log("======== MasterController.createPortfolio =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to create portfolio item"));
    }
  }

  static async deletePortfolio(req, res) {
    const masterId = getMasterId(res);
    const { id } = req.params;

    try {
      const deleted = await MasterPortfolio.destroy({ where: { id, userId: masterId } });
      if (!deleted) {
        return res.status(404).json(formatResponse(404, "Portfolio item not found"));
      }

      return res.status(200).json(formatResponse(200, "Portfolio item deleted"));
    } catch (error) {
      console.log("======== MasterController.deletePortfolio =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to delete portfolio item"));
    }
  }

  static async upcomingBookings(req, res) {
    const masterId = getMasterId(res);

    try {
      const bookings = await Booking.findAll({
        where: {
          masterId,
          startTime: { [Op.gte]: new Date() },
        },
        order: [["startTime", "ASC"]],
      });
      const plainBookings = bookings
        .map((booking) => booking.get())
        .filter((booking) => {
          const status = String(booking.status ?? "").toLowerCase();

          return !status.includes("отмен") && !status.includes("cancel");
        });
      const clientIds = [...new Set(plainBookings.map((booking) => booking.clientId).filter(Boolean))];
      const serviceIds = [...new Set(plainBookings.map((booking) => booking.serviziId).filter(Boolean))];

      const [clients, services] = await Promise.all([
        clientIds.length ? User.findAll({ where: { id: { [Op.in]: clientIds } } }) : [],
        serviceIds.length ? Servizi.findAll({ where: { id: { [Op.in]: serviceIds } } }) : [],
      ]);
      const clientById = new Map(clients.map((client) => [client.id, client.get()]));
      const serviceById = new Map(services.map((service) => [service.id, service.get()]));

      const data = plainBookings.map((booking) => {
        const client = clientById.get(booking.clientId);
        const service = serviceById.get(booking.serviziId);

        return {
          id: booking.id,
          clientId: booking.clientId,
          masterId: booking.masterId,
          serviziId: booking.serviziId,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          clientComment: booking.clientComment,
          client: {
            name: client?.name ?? "",
            phone: client?.phone ?? "",
          },
          service,
          totalPrice: Number(service?.price) || 0,
        };
      });

      return res.status(200).json(formatResponse(200, "Upcoming bookings loaded", data));
    } catch (error) {
      console.log("======== MasterController.upcomingBookings =========");
      console.log(error);
      return res.status(500).json(formatResponse(500, "Failed to load bookings"));
    }
  }
}

module.exports = MasterController;
