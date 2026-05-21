const { GigaChat } = require("gigachat");
const { Agent } = require("node:https");
const http = require("http");
const {
  Booking,
  Category,
  Eco,
  ProfileMaster,
  Servizi,
  Shadule,
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

function toDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMinutesFromDate(value) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(totalMinutes) {
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  const minutes = `${totalMinutes % 60}`.padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildDateFromKeyAndMinutes(dateKey, totalMinutes) {
  const [hours, minutes] = formatTime(totalMinutes).split(":").map(Number);
  const date = new Date(`${dateKey}T00:00:00`);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function getRussianWeekdayLabel(day) {
  const labels = [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ];

  return labels[day] ?? "";
}

function getShortInitials(name) {
  return String(name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

function extractPromptPreferences(prompt) {
  const text = String(prompt ?? "").trim().toLowerCase();

  return {
    text,
    isTomorrow: /завтр/.test(text),
    isWeekend: /выходн|суббот|воскрес/.test(text),
    wantsMorning: /утр|до\s*12/.test(text),
    wantsAfternoon: /дн[её]м|после\s*12|после\s*13|после\s*14|после\s*15|после\s*16/.test(text),
    wantsEvening: /вечер|после\s*17|после\s*18|после\s*19/.test(text),
    explicitHour: (() => {
      const match = text.match(/(\d{1,2})[:.](\d{2})|после\s*(\d{1,2})/);

      if (!match) return null;
      if (match[1]) return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
      return Number.parseInt(match[3], 10) * 60;
    })(),
  };
}

function textIncludesCategory(service, categoryTitle, promptText) {
  const haystack = [
    service.title,
    service.description,
    categoryTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!promptText) {
    return true;
  }

  const keywords = promptText
    .split(/[\s,!.?;:]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);

  if (!keywords.length) {
    return true;
  }

  return keywords.some((keyword) => haystack.includes(keyword));
}

function scoreTimePreference(slotStartMinutes, preferences, date) {
  let score = 0;

  if (preferences.explicitHour !== null) {
    score += Math.max(0, 30 - Math.abs(slotStartMinutes - preferences.explicitHour) / 10);
  }

  if (preferences.wantsEvening && slotStartMinutes >= 17 * 60) score += 10;
  if (preferences.wantsAfternoon && slotStartMinutes >= 12 * 60 && slotStartMinutes < 17 * 60) {
    score += 8;
  }
  if (preferences.wantsMorning && slotStartMinutes < 12 * 60) score += 8;
  if (preferences.isTomorrow) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (toDateKey(tomorrow) === toDateKey(date)) score += 16;
  }
  if (preferences.isWeekend && [0, 6].includes(date.getDay())) score += 16;

  return score;
}

function buildOptionId(serviceId, dateKey, slotStartMinutes) {
  return `${serviceId}-${dateKey}-${slotStartMinutes}`;
}

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
          content:
            "Ты - полезный помощник, помоги пользователю создать план выполнения задачи по пунктам. Описание задачи будет в сообщении пользователя. В ответе следуй формату markdown.",
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
        Eco.findAll({
          attributes: ["masterId", "rating"],
        }),
        Category.findAll({
          attributes: ["id", "title", "titleEn"],
        }),
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
    const categoryTitleEnById = new Map(
      categories.map((category) => [category.id, category.titleEn]),
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
          titleEn: profile?.titleEn || null,
          description: profile?.description || "",
          descriptionEn: profile?.descriptionEn || null,
          city: profile?.city || "",
          address: profile?.address || "",
          rating,
          reviewCount: masterRatings.length,
          categoryIds: masterCategoryIds,
          categoryTitles: masterCategoryIds
            .map((categoryId) => categoryTitleById.get(categoryId))
            .filter(Boolean),
          categoryTitlesEn: masterCategoryIds
            .map((categoryId) => categoryTitleEnById.get(categoryId))
            .filter(Boolean),
          services: masterServices.slice(0, 3).map((service) => ({
            id: service.id,
            title: service.title,
            titleEn: service.titleEn || null,
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

  static async searchBookingOptions(prompt, clientId, options = {}) {
    const limit = Number.parseInt(options.limit, 10) || 6;
    const preferences = extractPromptPreferences(prompt);

    const [masters, profiles, services, categories, shadules, bookings, reviews] =
      await Promise.all([
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
            ["id", "ASC"],
          ],
        }),
        Category.findAll({
          attributes: ["id", "title"],
        }),
        Shadule.findAll({
          where: { isWorkingDay: true },
        }),
        Booking.findAll(),
        Eco.findAll({
          attributes: ["masterId", "rating"],
        }),
      ]);

    const categoryTitleById = new Map(
      categories.map((category) => [category.id, category.title]),
    );
    const profileByMasterId = new Map(
      profiles.map((profile) => [profile.userId, profile.get()]),
    );
    const masterById = new Map(masters.map((master) => [master.id, master.get()]));

    const reviewsByMasterId = new Map();
    for (const review of reviews) {
      const current = reviewsByMasterId.get(review.masterId) ?? [];
      current.push(Number(review.rating) || 0);
      reviewsByMasterId.set(review.masterId, current);
    }

    const shadulesByMasterId = new Map();
    for (const shadule of shadules) {
      const current = shadulesByMasterId.get(shadule.masterId) ?? [];
      current.push(shadule.get());
      shadulesByMasterId.set(shadule.masterId, current);
    }

    const activeBookingsByMasterId = new Map();
    for (const booking of bookings) {
      const plainBooking = booking.get();

      if (String(plainBooking.status ?? "").toLowerCase().includes("отмен")) {
        continue;
      }

      const current = activeBookingsByMasterId.get(plainBooking.masterId) ?? [];
      current.push(plainBooking);
      activeBookingsByMasterId.set(plainBooking.masterId, current);
    }

    const recommendedMasters = await this.getRecommendedMastersForClient(clientId, {
      limit: 20,
    });
    const recommendedMasterIdScore = new Map(
      recommendedMasters.map((master, index) => [master.id, Math.max(1, 20 - index * 2)]),
    );

    const optionsFound = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const service of services) {
      const plainService = service.get();
      const master = masterById.get(plainService.masterId);

      if (!master) {
        continue;
      }

      const profile = profileByMasterId.get(plainService.masterId);
      const categoryTitle = categoryTitleById.get(plainService.categoryId) ?? "";
      const masterShadules = shadulesByMasterId.get(plainService.masterId) ?? [];
      const masterBookings = activeBookingsByMasterId.get(plainService.masterId) ?? [];
      const masterRatings = reviewsByMasterId.get(plainService.masterId) ?? [];
      const rating = average(masterRatings) || Number(profile?.rating) || 0;

      if (!textIncludesCategory(plainService, categoryTitle, preferences.text)) {
        continue;
      }

      for (let dayIndex = 0; dayIndex < 21; dayIndex += 1) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayIndex);

        if (preferences.isTomorrow && dayIndex !== 1) {
          continue;
        }

        if (preferences.isWeekend && ![0, 6].includes(currentDate.getDay())) {
          continue;
        }

        const dateKey = toDateKey(currentDate);
        const dayShadules = masterShadules.filter(
          (item) => item.dayOdWeek === currentDate.getDay(),
        );

        if (!dayShadules.length) {
          continue;
        }

        const dayBookings = masterBookings.filter(
          (booking) => toDateKey(new Date(booking.startTime)) === dateKey,
        );

        for (const shadule of dayShadules) {
          const workStart = getMinutesFromDate(shadule.startTime);
          const workEnd = getMinutesFromDate(shadule.endTime);
          const duration = Number(plainService.duration) || 0;

          for (
            let slotStartMinutes = workStart;
            slotStartMinutes + duration <= workEnd;
            slotStartMinutes += duration
          ) {
            const slotStart = buildDateFromKeyAndMinutes(dateKey, slotStartMinutes);
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + duration);

            if (slotStart <= new Date()) {
              continue;
            }

            const hasConflict = dayBookings.some((booking) => {
              const bookingStart = new Date(booking.startTime);
              const bookingEnd = new Date(booking.endTime);

              return slotStart < bookingEnd && slotEnd > bookingStart;
            });

            if (hasConflict) {
              continue;
            }

            const timeScore = scoreTimePreference(
              slotStartMinutes,
              preferences,
              currentDate,
            );
            const recommendationScore =
              recommendedMasterIdScore.get(plainService.masterId) ?? 0;
            const textScore = preferences.text ? 10 : 0;
            const totalScore =
              recommendationScore +
              rating * 5 +
              timeScore +
              textScore -
              (Number(plainService.price) || 0) / 10000;

            optionsFound.push({
              id: buildOptionId(plainService.id, dateKey, slotStartMinutes),
              masterId: plainService.masterId,
              serviziId: plainService.id,
              initials: getShortInitials(profile?.title || master.name),
              name: profile?.title || master.name,
              meta: `${categoryTitle || "Услуга"} · рейтинг ${rating.toFixed(1)}`,
              service: plainService.title,
              price: `${Number(plainService.price || 0).toLocaleString("ru-RU")} ₽ • ${Number(plainService.duration || 0)} мин`,
              slot: `${getRussianWeekdayLabel(currentDate.getDay())}, ${currentDate.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })} ${formatTime(slotStartMinutes)}`,
              date: buildDateFromKeyAndMinutes(dateKey, 0).toISOString(),
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              serviceTitle: plainService.title,
              score: totalScore,
            });
          }
        }
      }
    }

    return optionsFound
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      })
      .slice(0, limit)
      .map(({ score, ...option }) => option);
  }
}

module.exports = AiService;
