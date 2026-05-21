"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getMediaUrl } from "@/shared/lib/media";
import "./page.css";
import { mapSalesToPromotions } from "@/features/promotions/lib/promotionUtils";
import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { PromotionsSection } from "@/features/promotions/ui/PromotionsSection";
import { getCategories } from "@/shared/api/categoryApi";
import { getSales } from "@/shared/api/saleApi";
import { getServices } from "@/shared/api/serviziApi";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import { getLocalizedDescription, getLocalizedTitle } from "@/shared/lib/localized";
import type { CategoryType, ServiziType } from "@/shared/types";

const SERVICE_IMAGE_FALLBACK = "/фон3.jpeg";

function getServiceImageSrc(service: ServiziType) {
  return getMediaUrl(service.image) || SERVICE_IMAGE_FALLBACK;
}

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [categories, setCategories] = useState<CategoryType[]>([]);
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

        const [categoriesData, servicesData, salesData] = await Promise.all([
          getCategories(),
          getServices(),
          getSales(),
        ]);

        setCategories(categoriesData);
        setServices(servicesData);
        setPromotions(mapSalesToPromotions(salesData, servicesData));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("home.loadError");

        setServicesError(message);
        setPromotionsError(message);
      }
    };

    void loadHomeData();
  }, [t]);

  const visibleServices = useMemo(() => {
    const activeServices = services.filter((service) => service.isActive);

    return categories
      .map((category) => {
        const categoryServices = activeServices.filter(
          (service) => service.categoryId === category.id,
        );

        if (categoryServices.length === 0) {
          return null;
        }

        const primaryService =
          categoryServices.find((service) => service.title.trim() === category.title.trim()) ??
          categoryServices[0];

        return {
          ...primaryService,
          title: getLocalizedTitle(category, locale) ?? category.title,
          description:
            getLocalizedDescription(primaryService, locale) ?? primaryService.description,
        };
      })
      .filter((service): service is ServiziType => service !== null);
  }, [categories, locale, services]);

  return (
    <main className="home-page">
      <div className="page-shell">
        <section className="services-section">
          <div className="hero-assistant-card">
            <div className="assistant-badge">AI</div>
            <div className="assistant-copy">
              <strong>{t("home.aiTitle")}</strong>
              <span>{t("home.aiDescription")}</span>
            </div>
            <button className="small-button" type="button" onClick={handleAiClick}>
              {t("home.book")}
            </button>
          </div>

          <div className="section-heading">
            <span>{t("home.services")}</span>
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
                    href={`/services/${service.categoryId}`}
                  >
                    {service.title}
                  </Link>
                  <p>{service.description}</p>
                  <Link
                    className="card-button glass-button glass-button--compact"
                    href={`/services/${service.categoryId}`}
                  >
                    {t("home.book")}
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
