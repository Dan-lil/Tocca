"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import "./page.css";
import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { PromotionsSection } from "@/features/promotions/ui/PromotionsSection";
import { getSales } from "@/shared/api/saleApi";
import { getServices } from "@/shared/api/serviziApi";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import type { SaleType, ServiziType } from "@/shared/types";

const SERVICE_IMAGE_FALLBACK = "/фон3.jpeg";
const PROMOTION_IMAGE_FALLBACK = "/акция_дня.jpeg";

// Собираем путь до картинки услуги из базы или берем локальную заглушку
function getServiceImageSrc(service: ServiziType) {
  return service.image || SERVICE_IMAGE_FALLBACK;
}

// Собираем полный путь до картинки акции на сервере
function getPromotionImageSrc(imagePath?: string | null) {
  if (!imagePath) return PROMOTION_IMAGE_FALLBACK;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${apiBaseUrl}${imagePath}`;
}

// Преобразуем сущность Sale в формат карточки акции на клиенте
function mapSalesToPromotions(
  sales: SaleType[],
  services: ServiziType[],
): PromotionItem[] {
  return sales.map((sale) => {
    const relatedService =
      services.find((service) => service.id === sale.serviziId) ?? null;
    const serviceTitle = relatedService?.title ?? "Услуга";
    const masterName = `Мастер #${sale.masterId}`;

    return {
      id: sale.id,
      title: sale.comment || `Акция ${sale.discount}%`,
      comment: sale.comment || `Скидка ${sale.discount}%`,
      image: getPromotionImageSrc(sale.image),
      expiresAt: new Date(sale.date).toLocaleDateString("ru-RU"),
      masterName,
      serviceTitle,
    };
  });
}

export default function HomePage() {
  const [services, setServices] = useState<ServiziType[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);

  // Все AI кнопки на странице вызывают один и тот же сценарий модалки
  const handleAiClick = useCallback(() => {
    dispatchBookingModalOpen();
  }, []);

  useEffect(() => {
    // Для витрины на главной берем услуги и акции прямо из базы через серверный API
    const loadHomeData = async () => {
      try {
        setServicesError(null);
        setPromotionsError(null);

        const [servicesData, salesData] = await Promise.all([
          getServices(),
          getSales(),
        ]);

        setServices(servicesData);
        setPromotions(mapSalesToPromotions(salesData, servicesData));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Не удалось загрузить данные";

        setServicesError(message);
        setPromotionsError(message);
      }
    };

    void loadHomeData();
  }, []);

  const visibleServices = useMemo(
    // Показываем на главной только активные услуги из базы
    () => services.filter((service) => service.isActive).slice(0, 5),
    [services],
  );

  return (
    <main className="home-page">
      <div className="page-shell">
        <section className="services-section">
          <div className="hero-assistant-card">
            <div className="assistant-badge">AI</div>
            <div className="assistant-copy">
              <strong>AI - помощник</strong>
              <span>Опишите, что вы хотите - я найду подходящих мастеров</span>
            </div>
            <button className="small-button" type="button" onClick={handleAiClick}>
              Записаться
            </button>
          </div>

          <div className="section-heading">
            <span>Услуги</span>
          </div>

          {servicesError ? <p className="service-load-error">{servicesError}</p> : null}

          <div className="services-grid">
            {visibleServices.map((service, index) => (
              // На главной показываем услуги из базы вместе с путями до изображений
              <article className="service-card" key={`service-${service.id}-${index}`}>
                <div className="service-media">
                  <Image src={getServiceImageSrc(service)} alt={service.title} fill />
                </div>
                <div className="service-overlay">
                  <Link
                    className="glass-button glass-button--compact service-title-link"
                    href={`/services/${service.categoryId}?serviceId=${service.id}`}
                  >
                    {service.title}
                  </Link>
                  <p>{service.description}</p>
                  <Link
                    className="card-button glass-button glass-button--compact"
                    href={`/services/${service.categoryId}?serviceId=${service.id}`}
                  >
                    Записаться
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {promotionsError ? (
          <p className="service-load-error">{promotionsError}</p>
        ) : null}

        <PromotionsSection promotions={promotions} />
      </div>

      <button className="chat-fab" type="button" onClick={handleAiClick}>
        <span>AI</span>
      </button>
    </main>
  );
}
