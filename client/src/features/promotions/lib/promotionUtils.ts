import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import type { SaleType, ServiziType } from "@/shared/types";

// Общие преобразования для акций на главной и в шапке
const PROMOTION_IMAGE_FALLBACK = "/акция_дня.jpeg";

// Собираем полный путь к картинке акции или отдаем локальную заглушку
export function getPromotionImageSrc(imagePath?: string | null) {
  if (!imagePath) return PROMOTION_IMAGE_FALLBACK;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${apiBaseUrl}${imagePath}`;
}

// Приводим ответ sales и servizi к одному формату карточки акции
export function mapSalesToPromotions(
  sales: SaleType[],
  services: ServiziType[],
): PromotionItem[] {
  return sales.map((sale) => {
    const relatedService =
      services.find((service) => service.id === sale.serviziId) ?? null;
    const serviceTitle = relatedService?.title ?? "Услуга";
    const masterName =
      relatedService?.masterName?.trim() || `Мастер #${sale.masterId}`;
    const masterRating =
      services.find((service) => service.masterId === sale.masterId)?.masterRating ?? 0;
    const masterServices = services.filter(
      (service) => service.masterId === sale.masterId && service.isActive,
    );

    return {
      id: sale.id,
      masterId: sale.masterId,
      masterRating,
      categoryId: relatedService?.categoryId ?? 0,
      discount: sale.discount,
      title: sale.comment || `Акция ${sale.discount}%`,
      comment: sale.comment || `Скидка ${sale.discount}%`,
      image: getPromotionImageSrc(sale.image),
      expiresAt: new Date(sale.date).toLocaleDateString("ru-RU"),
      expiresAtRaw: sale.date,
      masterName,
      serviceTitle,
      services:
        masterServices.length > 0
          ? masterServices
          : relatedService
            ? [relatedService]
            : [],
    };
  });
}

// Выбираем акции дня по убыванию скидки и ближайшей дате окончания
export function getDailyPromotions(
  sales: SaleType[],
  services: ServiziType[],
  limit = 2,
) {
  const sortedSales = [...sales].sort((left, right) => {
    if (right.discount !== left.discount) {
      return right.discount - left.discount;
    }

    return new Date(left.date).getTime() - new Date(right.date).getTime();
  });

  return mapSalesToPromotions(sortedSales.slice(0, limit), services);
}
