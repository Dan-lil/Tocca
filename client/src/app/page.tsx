"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import "./page.css";
import { promotions } from "@/features/promotions/model/promotions.data";
import { PromotionsSection } from "@/features/promotions/ui/PromotionsSection";
import { getServices } from "@/shared/api/serviziApi";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import { ServiziType } from "@/shared/types";

const SERVICE_IMAGE_FALLBACK = "/услуги на главной/ногти9.jpg";

// Собираем путь до картинки услуги из базы или берем локальную заглушку
function getServiceImageSrc(service: ServiziType) {
  return service.image || SERVICE_IMAGE_FALLBACK;
}

export default function HomePage() {
  const [services, setServices] = useState<ServiziType[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Все AI кнопки на странице вызывают один и тот же сценарий модалки
  const handleAiClick = useCallback(() => {
    dispatchBookingModalOpen();
  }, []);

  useEffect(() => {
    // Для витрины на главной берем услуги прямо из базы через серверный API
    const loadServices = async () => {
      try {
        setServicesError(null);
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (error) {
        setServicesError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить услуги",
        );
      }
    };

    void loadServices();
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
            <button
              className="small-button"
              type="button"
              onClick={handleAiClick}
            >
              Записаться
            </button>
          </div>

          <div className="section-heading">
            <span>Услуги</span>
          </div>

          {servicesError ? (
            <p className="service-load-error">{servicesError}</p>
          ) : null}

          <div className="services-grid">
            {visibleServices.map((service) => (
              // На главной показываем услуги из базы вместе с путями до изображений
              <article className="service-card" key={service.id}>
                <div className="service-media">
                  <Image
                    src={getServiceImageSrc(service)}
                    alt={service.title}
                    fill
                  />
                </div>
                <div className="service-overlay">
                  <Link
                    className="glass-button glass-button--compact service-title-link"
                    href={`/services/${service.categoryId}`}
                  >
                    {service.title}
                  </Link>
                  <p>{service.description}</p>
                  <button
                    className="card-button glass-button glass-button--compact"
                    type="button"
                  >
                    Записаться
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Подключаем блок с акциями */}
        <PromotionsSection promotions={promotions} />
      </div>

      <button className="chat-fab" type="button" onClick={handleAiClick}>
        <span>AI</span>
      </button>
    </main>
  );
}
