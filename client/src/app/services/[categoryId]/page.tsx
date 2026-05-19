"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import "../../page.css";
import "./page.css";
import { getCategoryById } from "@/shared/api/categoryApi";
import { getReviewsByMaster } from "@/shared/api/ecoApi";
import { getServicesByCategory } from "@/shared/api/serviziApi";
import { useAppSelector } from "@/shared/hooks/useReduxHooks";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import { CategoryType, EcoReviewType, ServiziType } from "@/shared/types";

type ServiceDirectoryCard = {
  id: number;
  masterId: number;
  masterName: string;
  masterRating: number;
  meta: string;
  serviceTitle: string;
  serviceDescription: string;
  services: ServiziType[];
};

function buildServiceCards(
  services: ServiziType[],
  categoryTitle: string,
): ServiceDirectoryCard[] {
  const activeServices = services.filter((service) => service.isActive);
  const visibleServices = activeServices.length > 0 ? activeServices : services;
  const servicesByMaster = new Map<number, ServiziType[]>();

  visibleServices.forEach((service) => {
    const masterServices = servicesByMaster.get(service.masterId) ?? [];
    servicesByMaster.set(service.masterId, [...masterServices, service]);
  });

  return Array.from(servicesByMaster.entries()).map(([masterId, masterServices]) => {
    const masterName = masterServices[0]?.masterName?.trim() || `Мастер #${masterId}`;
    const masterRating = Number(masterServices[0]?.masterRating ?? 0);
    const skillLabel = categoryTitle || "Услуги";
    const priceFrom = Math.min(...masterServices.map((service) => service.price));
    const primaryService = masterServices[0];

    return {
      id: masterId,
      masterId,
      masterName,
      masterRating,
      meta: `${skillLabel} · от ${priceFrom.toLocaleString("ru-RU")} ₽`,
      serviceTitle: primaryService?.title ?? skillLabel,
      serviceDescription: primaryService?.description ?? "",
      services: masterServices,
    };
  });
}

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams<{ categoryId: string }>();
  const searchParams = useSearchParams();
  const categoryId = params?.categoryId;
  const selectedServiceId = searchParams.get("serviceId");
  const user = useAppSelector((state) => state.user.user);

  const [category, setCategory] = useState<CategoryType | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedReviewsMasterId, setExpandedReviewsMasterId] = useState<number | null>(null);
  const [reviewsByMaster, setReviewsByMaster] = useState<Record<number, EcoReviewType[]>>({});
  const [reviewsLoadingByMaster, setReviewsLoadingByMaster] = useState<Record<number, boolean>>(
    {},
  );
  const [reviewsErrorByMaster, setReviewsErrorByMaster] = useState<Record<number, string | null>>(
    {},
  );

  useEffect(() => {
    if (!categoryId) return;

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

  const visibleServices = useMemo(() => {
    if (!selectedServiceId) return services;

    const serviceId = Number(selectedServiceId);
    if (Number.isNaN(serviceId)) return services;

    const matchedService = services.filter((service) => service.id === serviceId);
    return matchedService.length > 0 ? matchedService : services;
  }, [selectedServiceId, services]);

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;

    const serviceId = Number(selectedServiceId);
    if (Number.isNaN(serviceId)) return null;

    return services.find((service) => service.id === serviceId) ?? null;
  }, [selectedServiceId, services]);

  const pageTitle = selectedService?.title ?? category?.title ?? "Услуги";

  const serviceCards = useMemo(
    () => buildServiceCards(visibleServices, pageTitle),
    [pageTitle, visibleServices],
  );

  const handleToggleReviews = async (masterId: number) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (expandedReviewsMasterId === masterId) {
      setExpandedReviewsMasterId(null);
      return;
    }

    setExpandedReviewsMasterId(masterId);

    if (reviewsByMaster[masterId] || reviewsLoadingByMaster[masterId]) {
      return;
    }

    try {
      setReviewsLoadingByMaster((prev) => ({ ...prev, [masterId]: true }));
      setReviewsErrorByMaster((prev) => ({ ...prev, [masterId]: null }));

      const reviewsData = await getReviewsByMaster(masterId);

      setReviewsByMaster((prev) => ({ ...prev, [masterId]: reviewsData }));
    } catch (loadError) {
      setReviewsErrorByMaster((prev) => ({
        ...prev,
        [masterId]:
          loadError instanceof Error ? loadError.message : "Не удалось загрузить отзывы",
      }));
    } finally {
      setReviewsLoadingByMaster((prev) => ({ ...prev, [masterId]: false }));
    }
  };

  return (
    <main className="services-directory-page">
      <div className="services-directory-shell">
        <section className="services-directory-hero">
          <div className="services-directory-hero-copy glass-surface">
            <span className="services-directory-eyebrow">Категория услуг</span>
            <h1>{pageTitle}</h1>
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
            {serviceCards.map((card) => {
              const isReviewsOpen = expandedReviewsMasterId === card.masterId;
              const reviews = reviewsByMaster[card.masterId] ?? [];
              const isReviewsLoading = reviewsLoadingByMaster[card.masterId] ?? false;
              const reviewsError = reviewsErrorByMaster[card.masterId] ?? null;

              return (
                <article className="services-directory-card glass-surface" key={card.id}>
                  <div className="services-directory-card-head">
                    <div className="services-directory-card-head-copy">
                      <strong>{card.masterName}</strong>
                      <span>{card.meta}</span>
                    </div>
                    <div className="services-directory-card-rating" aria-label={`Рейтинг ${card.masterRating}`}>
                      <span className="services-directory-card-rating-star">★</span>
                      <strong>{card.masterRating.toFixed(1)}</strong>
                    </div>
                  </div>

                  <div className="services-directory-badges">
                    <Link
                      className="services-directory-badge services-directory-badge-link"
                      href={`/masters/${card.masterId}`}
                    >
                      Профиль мастера
                    </Link>
                    <button
                      className={`services-directory-badge${isReviewsOpen ? " is-active" : ""}`}
                      type="button"
                      onClick={() => {
                        void handleToggleReviews(card.masterId);
                      }}
                    >
                      Отзывы
                    </button>
                  </div>

                  {isReviewsOpen ? (
                    <div className="services-reviews-dropdown">
                      {isReviewsLoading ? (
                        <p className="services-reviews-state">Загружаю отзывы мастера...</p>
                      ) : null}

                      {!isReviewsLoading && reviewsError ? (
                        <p className="services-reviews-state">{reviewsError}</p>
                      ) : null}

                      {!isReviewsLoading && !reviewsError && reviews.length === 0 ? (
                        <p className="services-reviews-state">У мастера пока нет отзывов.</p>
                      ) : null}

                      {!isReviewsLoading && !reviewsError && reviews.length > 0 ? (
                        <div className="services-reviews-list">
                          {reviews.map((review) => (
                            <article className="services-reviews-card" key={review.id}>
                              <div className="services-reviews-card-head">
                                <strong>Клиент #{review.clientId}</strong>
                                <span className="services-reviews-rating">
                                  {"★".repeat(review.rating)}
                                  {"☆".repeat(Math.max(0, 5 - review.rating))}
                                </span>
                              </div>
                              <p>{review.text}</p>
                            </article>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    className="services-directory-card-button"
                    type="button"
                    onClick={() =>
                      dispatchBookingModalOpen({
                        categoryId: Number(categoryId),
                        categoryTitle: category?.title ?? "Услуги",
                        masterId: card.masterId,
                        masterName: card.masterName,
                        services: card.services,
                      })
                    }
                  >
                    Записаться
                  </button>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
