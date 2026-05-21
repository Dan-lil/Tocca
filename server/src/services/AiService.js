const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");
const http = require("http");
const {
  Booking,
  Category,
  Eco,
  ProfileMaster,
  Servizi,
  User,
} = require("../db/models");

// ==================== Helper Functions ====================

function getUniqueNumberList(values) {
  return [...new Set(values.filter((value) => Number.isInteger(value)))];
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function rankMastersLocally(payload) {
  const limit = Number.parseInt(payload.limit, 10) || 6;
  const bookedMasterIds = new Set(payload.bookedMasterIds ?? []);
  const preferredCategoryIds = new Set(payload.preferredCategoryIds ?? []);
  const candidateMasters = Array.isArray(payload.candidateMasters)
    ? payload.candidateMasters
    : [];

  const mastersToRank = candidateMasters.filter(
    (master) => !bookedMasterIds.has(master.id),
  );

  if (!bookedMasterIds.size) {
    return mastersToRank
      .sort((a, b) => {
        if ((b.rating ?? 0) !== (a.rating ?? 0))
          return (b.rating ?? 0) - (a.rating ?? 0);
        if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) {
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        }
        return a.id - b.id;
      })
      .slice(0, limit)
      .map((master) => master.id);
  }

  return mastersToRank
    .map((master) => {
      const categoryMatch = (master.categoryIds ?? []).filter((categoryId) =>
        preferredCategoryIds.has(categoryId),
      ).length;
      return {
        ...master,
        score:
          categoryMatch * 10 +
          (Number(master.rating) || 0) * 6 +
          Math.min(10, (Number(master.reviewCount) || 0) / 5),
      };
    })
    .filter((master) => master.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.rating ?? 0) !== (a.rating ?? 0))
        return (b.rating ?? 0) - (a.rating ?? 0);
      if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) {
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      }
      return a.id - b.id;
    })
    .slice(0, limit)
    .map((master) => master.id);
}

function getTopMastersByRating(candidateMasters, bookedMasterIds, limit) {
  const bookedMasterIdSet = new Set(bookedMasterIds ?? []);
  return (candidateMasters ?? [])
    .filter((master) => !bookedMasterIdSet.has(master.id))
    .sort((a, b) => {
      if ((b.rating ?? 0) !== (a.rating ?? 0))
        return (b.rating ?? 0) - (a.rating ?? 0);
      if ((b.reviewCount ?? 0) !== (a.reviewCount ?? 0)) {
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      }
      return a.id - b.id;
    })
    .slice(0, limit)
    .map((master) => master.id);
}

// ==================== AiService Class ====================

class AiService {
  static async generateText(prompt) {
    const { title, text } = prompt;
    const httpsAgent = new Agent({ rejectUnauthorized: false });
    const client = new GigaChat({
      model: "GigaChat",
      credentials: process.env.GIGACHAT_API_KEY,
      httpsAgent: httpsAgent,
    });

    const response = await client.chat({
      messages: [
        {
          role: "system",
          content: `Ты - полезный помощник, помоги пользователю создать план выполнения задачи по пунктам. Описание задачи будет в сообщении пользователя. В ответе следуй формату markdown.`,
        },
        {
          role: "user",
          content: `Создай план выполнения задачи "${title}". Описание задачи: ${text}`,
        },
      ],
    });
    return response.choices[0]?.message.content;
  }

  static async getMasterRecommendations(payload) {
    const pythonServiceUrl =
      process.env.PYTHON_RECOMMENDATION_URL || "http://localhost:8001";
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const options = {
        hostname: new URL(pythonServiceUrl).hostname,
        port: new URL(pythonServiceUrl).port || 8001,
        path: "/recommendations",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      };
      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode === 200 && response.data) {
              resolve(response.data);
            } else {
              reject(new Error(response.message || `HTTP ${res.statusCode}`));
            }
          } catch (error) {
            reject(new Error("Invalid JSON response from Python service"));
          }
        });
      });
      req.on("error", (error) => {
        reject(
          new Error(`Failed to connect to Python service: ${error.message}`),
        );
      });
      req.write(data);
      req.end();
    });
  }

  static async getGeoSortedMasters(payload) {
    const pythonServiceUrl =
      process.env.PYTHON_RECOMMENDATION_URL || "http://localhost:8001";
    const data = JSON.stringify(payload);
    const options = {
      hostname: new URL(pythonServiceUrl).hostname,
      port: new URL(pythonServiceUrl).port || 8001,
      path: "/geo-sort",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode === 200 && parsed.data) resolve(parsed.data);
            else reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          } catch (e) {
            reject(new Error("Invalid JSON from Python service"));
          }
        });
      });
      req.on("error", (e) =>
        reject(new Error(`Python service connection failed: ${e.message}`)),
      );
      req.write(data);
      req.end();
    });
  }

  static async getRecommendedMastersForClient(clientId, options = {}) {
    const limit = Number.parseInt(options.limit, 10) || 6;
    const [bookings, masters, profiles, services, reviews, categories] =
      await Promise.all([
        Booking.findAll({
          where: { clientId },
          attributes: ["masterId", "serviziId"],
        }),
        User.findAll({
          where: { role: "master" },
          attributes: ["id", "name", "avatar"],
          order: [["id", "ASC"]],
        }),
        ProfileMaster.findAll(),
        Servizi.findAll({
          where: { isActive: true },
          order: [
            ["masterId", "ASC"],
            ["price", "ASC"],
            ["id", "ASC"],
          ],
        }),
        Eco.findAll({ attributes: ["masterId", "rating"] }),
        Category.findAll({ attributes: ["id", "title"] }),
      ]);

    const bookedMasterIds = getUniqueNumberList(
      bookings.map((booking) => booking.masterId),
    );
    const bookedServiceIds = getUniqueNumberList(
      bookings.map((booking) => booking.serviziId),
    );
    const bookedServiceIdSet = new Set(bookedServiceIds);
    const preferredCategoryIds = getUniqueNumberList(
      services
        .filter((service) => bookedServiceIdSet.has(service.id))
        .map((service) => service.categoryId),
    );

    const profileByMasterId = new Map(
      profiles.map((profile) => [profile.userId, profile.get()]),
    );
    const categoryTitleById = new Map(
      categories.map((category) => [category.id, category.title]),
    );

    const servicesByMasterId = new Map();
    for (const service of services) {
      const plainService = service.get();
      const current = servicesByMasterId.get(plainService.masterId) ?? [];
      current.push(plainService);
      servicesByMasterId.set(plainService.masterId, current);
    }

    const reviewsByMasterId = new Map();
    for (const review of reviews) {
      const current = reviewsByMasterId.get(review.masterId) ?? [];
      current.push(Number(review.rating) || 0);
      reviewsByMasterId.set(review.masterId, current);
    }

    const candidates = masters
      .map((master) => {
        const plainMaster = master.get();
        const profile = profileByMasterId.get(plainMaster.id);
        const masterServices = servicesByMasterId.get(plainMaster.id) ?? [];
        const masterCategoryIds = getUniqueNumberList(
          masterServices.map((service) => service.categoryId),
        );
        const masterRatings = reviewsByMasterId.get(plainMaster.id) ?? [];
        const calculatedRating = average(masterRatings);
        const profileRating = Number(profile?.rating) || 0;
        const rating = calculatedRating || profileRating;

        if (!masterServices.length) return null;

        return {
          id: plainMaster.id,
          name: plainMaster.name,
          avatar: plainMaster.avatar,
          title: profile?.title || plainMaster.name,
          description: profile?.description || "",
          city: profile?.city || "",
          address: profile?.address || "",
          rating,
          reviewCount: masterRatings.length,
          categoryIds: masterCategoryIds,
          categoryTitles: masterCategoryIds
            .map((categoryId) => categoryTitleById.get(categoryId))
            .filter(Boolean),
          services: masterServices.slice(0, 3).map((service) => ({
            id: service.id,
            title: service.title,
            price: Number(service.price) || 0,
            duration: Number(service.duration) || 0,
            categoryId: service.categoryId,
          })),
        };
      })
      .filter(Boolean);

    const payload = {
      bookedMasterIds,
      preferredCategoryIds,
      candidateMasters: candidates.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        categoryIds: candidate.categoryIds,
        rating: candidate.rating,
        reviewCount: candidate.reviewCount,
      })),
      limit,
    };

    let recommendedIds = [];
    try {
      recommendedIds = await this.getMasterRecommendations(payload);
    } catch (error) {
      console.log(
        "==== AiService.getRecommendedMastersForClient fallback ==== ",
      );
      console.log(error.message);
      recommendedIds = rankMastersLocally(payload);
    }

    if (!recommendedIds.length) {
      recommendedIds = getTopMastersByRating(
        payload.candidateMasters,
        bookedMasterIds,
        limit,
      );
    }
    if (!recommendedIds.length) {
      recommendedIds = getTopMastersByRating(
        payload.candidateMasters,
        [],
        limit,
      );
    }

    const candidateById = new Map(
      candidates.map((candidate) => [candidate.id, candidate]),
    );

    return recommendedIds
      .map((masterId) => candidateById.get(masterId))
      .filter(Boolean)
      .map((master) => {
        const matchedCategories = master.categoryIds.filter((categoryId) =>
          preferredCategoryIds.includes(categoryId),
        );
        return {
          ...master,
          reason:
            matchedCategories.length > 0
              ? `Подходит по вашим любимым категориям: ${matchedCategories
                  .map((categoryId) => categoryTitleById.get(categoryId))
                  .filter(Boolean)
                  .join(", ")}`
              : "Рекомендуем по рейтингу и популярности",
        };
      });
  }
}

module.exports = AiService;
