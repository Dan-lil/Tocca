"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getMediaUrl } from "@/shared/lib/media";
import "./page.css";
import { mapSalesToPromotions } from "@/features/promotions/lib/promotionUtils";
import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { PromotionsSection } from "@/features/promotions/ui/PromotionsSection";
import { getSales } from "@/shared/api/saleApi";
import { getServices } from "@/shared/api/serviziApi";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import type { ServiziType } from "@/shared/types";

const SERVICE_IMAGE_FALLBACK = "/фон3.jpeg";

function getServiceImageSrc(service: ServiziType) {
  return getMediaUrl(service.image) || SERVICE_IMAGE_FALLBACK;
}

export default function HomePage() {
  const [services, setServices] = useState<ServiziType[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);

  const handleAiClick = useCallback(() => {
    dispatchBookingModalOpen();
  }, []);

  useEffect(() => {
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
              <article className="service-card" key={`service-${service.id}-${index}`}>
                <div className="service-media">
                  <Image
                    src={getServiceImageSrc(service)}
                    alt={service.title}
                    fill
                    unoptimized
                  />
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
