"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import "../../page.css";
import "./page.css";
import { getCategoryById } from "@/shared/api/categoryApi";
import { getServicesByCategory } from "@/shared/api/serviziApi";
import { CategoryType, ServiziType } from "@/shared/types";

type ServiceDirectoryCard = {
  id: number;
  masterName: string;
  meta: string;
  serviceTitle: string;
  serviceDescription: string;
  detailBadges: string[];
};

function buildServiceCards(
  services: ServiziType[],
  categoryTitle: string,
): ServiceDirectoryCard[] {
  // В карточки пускаем активные услуги, а если их нет, то весь список категории
  const activeServices = services.filter((service) => service.isActive);
  const visibleServices = activeServices.length > 0 ? activeServices : services;

  return visibleServices.map((service) => {
    const masterName = `Мастер #${service.masterId}`;
    const skillLabel = categoryTitle || "Услуги";

    return {
      id: service.id,
      masterName,
      // Пока в карточке оставляем только категорию как доступную мету
      meta: skillLabel,
      // Возвращаем в карточку название и описание услуги из базы
      serviceTitle: service.title,
      serviceDescription: service.description,
      detailBadges: ["Профиль мастера", "Отзывы"],
    };
  });
}

export default function CategoryPage() {
  // Берем categoryId из клиентского маршрута services/[categoryId]
  const params = useParams<{ categoryId: string }>();
  const searchParams = useSearchParams();
  const categoryId = params?.categoryId;
  const selectedServiceId = searchParams.get("serviceId");

  const [category, setCategory] = useState<CategoryType | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;

    // Собираем страницу из текущих сущностей Category и Servizi
    const loadCategoryPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [categoryData, servicesData] = await Promise.all([
          getCategoryById(categoryId),
          getServicesByCategory(categoryId),
        ]);

        setCategory(categoryData);
        setServices(servicesData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить страницу",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategoryPage();
  }, [categoryId]);

  const visibleServices = useMemo(
    // Если в маршруте передана конкретная услуга, показываем только ее карточку
    () => {
      if (!selectedServiceId) return services;

      const serviceId = Number(selectedServiceId);
      if (Number.isNaN(serviceId)) return services;

      const matchedService = services.filter((service) => service.id === serviceId);
      return matchedService.length > 0 ? matchedService : services;
    },
    [selectedServiceId, services],
  );

  const serviceCards = useMemo(
    // Собираем карточки из ответа по категории
    () => buildServiceCards(visibleServices, category?.title ?? ""),
    [category?.title, visibleServices],
  );

  return (
    <main className="services-directory-page">
      <div className="services-directory-shell">
        <section className="services-directory-hero">
          <div className="services-directory-hero-copy glass-surface">
            <span className="services-directory-eyebrow">Категория услуг</span>
            <h1>{category?.title ?? "Услуги"}</h1>
          </div>
          <Link className="glass-button services-directory-back" href="/">
            На главную
          </Link>
        </section>

        {isLoading ? (
          <section className="services-directory-state glass-surface">
            <p>Загружаю мастеров и услуги категории</p>
          </section>
        ) : null}

        {error ? (
          <section className="services-directory-state glass-surface">
            <p>{error}</p>
          </section>
        ) : null}

        {!isLoading && !error && serviceCards.length === 0 ? (
          <section className="services-directory-state glass-surface">
            <p>Для этой категории пока нет активных услуг</p>
          </section>
        ) : null}

        {!isLoading && !error && serviceCards.length > 0 ? (
          <section className="services-directory-grid">
            {/* ПЕРЕИСПОЛЬЗУЕМАЯ СТРУКТУРА КАРТОЧКИ УСЛУГИ */}
            {serviceCards.map((card) => (
              <article className="services-directory-card glass-surface" key={card.id}>
                <div className="services-directory-card-head">
                  <div className="services-directory-card-head-copy">
                    <strong>{card.masterName}</strong>
                    <span>{card.meta}</span>
                  </div>
                </div>

                <div className="services-directory-badges">
                  {card.detailBadges.map((badge) => (
                    <button className="services-directory-badge" key={badge} type="button">
                      {badge}
                    </button>
                  ))}
                </div>

                <div className="services-directory-card-copy">
                  <strong>{card.serviceTitle}</strong>
                  <p>{card.serviceDescription}</p>
                </div>

                <button className="services-directory-card-button" type="button">
                  Записаться
                </button>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
