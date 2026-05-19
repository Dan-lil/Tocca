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
  meta: string;
  serviceTitle: string;
  serviceDescription: string;
  detailBadges: string[];
  services: ServiziType[];
};

function buildServiceCards(
  services: ServiziType[],
  categoryTitle: string,
): ServiceDirectoryCard[] {
  // В карточки пускаем активные услуги, а если их нет, то весь список категории
  const activeServices = services.filter((service) => service.isActive);
  const visibleServices = activeServices.length > 0 ? activeServices : services;
  const servicesByMaster = new Map<number, ServiziType[]>();

  visibleServices.forEach((service) => {
    const masterServices = servicesByMaster.get(service.masterId) ?? [];
    servicesByMaster.set(service.masterId, [...masterServices, service]);
  });

  return Array.from(servicesByMaster.entries()).map(([masterId, masterServices]) => {
    const masterName = `Мастер #${masterId}`;
    const skillLabel = categoryTitle || "Услуги";
    const priceFrom = Math.min(...masterServices.map((service) => service.price));
    const primaryService = masterServices[0];

    return {
      id: masterId,
      masterId,
      masterName,
      meta: `${skillLabel} · от ${priceFrom.toLocaleString("ru-RU")} ₽`,
      // Для карточки мастера берем первую услугу как основную
      serviceTitle: primaryService?.title ?? skillLabel,
      serviceDescription: primaryService?.description ?? "",
      detailBadges: ["Профиль мастера", "Отзывы"],
      services: masterServices,
    };
  });
}

export default function CategoryPage() {
  const router = useRouter();
  // Берем categoryId из клиентского маршрута services/[categoryId]
  const params = useParams<{ categoryId: string }>();
  const searchParams = useSearchParams();
  const categoryId = params?.categoryId;
  const selectedServiceId = searchParams.get("serviceId");
  const user = useAppSelector((state) => state.user.user);

  const [category, setCategory] = useState<CategoryType | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviewsMasterName, setReviewsMasterName] = useState("");
  const [reviews, setReviews] = useState<EcoReviewType[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

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

  const visibleServices = useMemo(() => {
    // Если в маршруте передана конкретная услуга, показываем только ее карточку
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
    // Если выбрана конкретная услуга, используем ее название вместо общего имени категории
    () => buildServiceCards(visibleServices, pageTitle),
    [pageTitle, visibleServices],
  );

  const handleCloseReviewsModal = () => {
    setIsReviewsModalOpen(false);
    setReviews([]);
    setReviewsError(null);
    setReviewsMasterName("");
  };

  const handleOpenReviews = async (masterId: number, masterName: string) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      setIsReviewsModalOpen(true);
      setReviewsMasterName(masterName);
      setIsReviewsLoading(true);
      setReviewsError(null);
      setReviews([]);

      const reviewsData = await getReviewsByMaster(masterId);
      setReviews(reviewsData);
    } catch (loadError) {
      setReviewsError(
        loadError instanceof Error ? loadError.message : "Не удалось загрузить отзывы",
      );
    } finally {
      setIsReviewsLoading(false);
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
                    <button
                      className="services-directory-badge"
                      key={badge}
                      type="button"
                      onClick={() => {
                        if (badge === "Отзывы") {
                          void handleOpenReviews(card.masterId, card.masterName);
                        }
                      }}
                    >
                      {badge}
                    </button>
                  ))}
                </div>

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
            ))}
          </section>
        ) : null}

        {isReviewsModalOpen ? (
          <div
            className="services-reviews-backdrop"
            role="presentation"
            onClick={handleCloseReviewsModal}
          >
            <section
              className="services-reviews-modal glass-surface"
              role="dialog"
              aria-modal="true"
              aria-label={`Отзывы о мастере ${reviewsMasterName}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="services-reviews-head">
                <div className="services-reviews-head-copy">
                  <span>Отзывы</span>
                  <h2>{reviewsMasterName}</h2>
                </div>

                <button
                  className="services-reviews-close"
                  type="button"
                  onClick={handleCloseReviewsModal}
                  aria-label="Закрыть отзывы"
                >
                  ×
                </button>
              </div>

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
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
