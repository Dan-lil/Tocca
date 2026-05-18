"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import "../../page.css";
import "./page.css";
import { getCategoryById } from "@/shared/api/categoryApi";
import { getServicesByCategory } from "@/shared/api/serviziApi";
import { CategoryType, ServiziType } from "@/shared/types";

type ServiceDirectoryCard = {
  id: number;
  masterId: number;
  masterName: string;
  initials: string;
  meta: string;
  serviceTitle: string;
  serviceDescription: string;
  priceLabel: string;
  scheduleLabel: string;
  detailBadges: string[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildServiceCards(services: ServiziType[], categoryTitle: string): ServiceDirectoryCard[] {
  const activeServices = services.filter((service) => service.isActive);
  const visibleServices = activeServices.length > 0 ? activeServices : services;

  return visibleServices.map((service) => {
    const masterName = `Мастер #${service.masterId}`;
    const skillLabel = categoryTitle || "Услуги";

    return {
      id: service.id,
      masterId: service.masterId,
      masterName,
      initials: getInitials(masterName),
      // Пока на клиенте доступны только данные услуги и технический id мастера
      meta: `${skillLabel} / ${service.duration} мин`,
      serviceTitle: service.title,
      serviceDescription: service.description,
      priceLabel: `${service.price.toLocaleString("ru-RU")} ₽ • ${service.duration} мин`,
      // Точные слоты появятся после подключения расписания мастеров
      scheduleLabel: "Свободные слоты появятся после подключения расписания",
      // Эти блоки уже заложены в схеме сервера, но пока не приходят в ответе
      detailBadges: ["Профиль мастера", "Отзывы", "Расписание"],
    };
  });
}

export default function CategoryPage() {
  const params = useParams<{ categoryId: string }>();
  const categoryId = params?.categoryId;

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
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить страницу");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategoryPage();
  }, [categoryId]);

  const serviceCards = useMemo(
    () => buildServiceCards(services, category?.title ?? ""),
    [category?.title, services],
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
            {serviceCards.map((card) => (
              <article className="services-directory-card glass-surface" key={card.id}>
                <div className="services-directory-card-head">
                  <span className="services-directory-avatar">{card.initials}</span>
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

                <p className="services-directory-service-title">{card.serviceTitle}</p>
                <p className="services-directory-description">{card.serviceDescription}</p>
                <p className="services-directory-price">{card.priceLabel}</p>
                <p className="services-directory-slot">{card.scheduleLabel}</p>

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
