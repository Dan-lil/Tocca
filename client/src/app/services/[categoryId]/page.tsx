"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import "../../page.css";
import "./page.css";
import { getCategoryById } from "@/shared/api/categoryApi";
import { getReviewsByMaster } from "@/shared/api/ecoApi";
import { getPublicMasterProfile } from "@/shared/api/profileMasterApi";
import { getServicesByCategory } from "@/shared/api/serviziApi";
import { useNearbySearch } from "@/features/search/hooks/useNearbySearch";
import { useAppSelector } from "@/shared/hooks/useReduxHooks";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import { getLocalizedTitle } from "@/shared/lib/localized";
import { openDirectChat } from "@/shared/lib/openDirectChat";
import { expandPortfolioItems, getMasterAvatarUrl, getMediaUrl } from "@/shared/lib/media";
import DistanceBadge from "@/shared/ui/DistanceBadge/DistanceBadge";
import type {
  CategoryType,
  EcoReviewType,
  PublicMasterProfileType,
  ServiziType,
} from "@/shared/types";

const YandexMastersMap = dynamic(
  () => import("@/shared/ui/YandexMastersMap/YandexMastersMap"),
  {
    ssr: false,
    loading: () => <div className="services-directory-map-state">Карта загружается...</div>,
  },
);

type ServiceDirectoryCard = {
  id: number;
  masterId: number;
  masterName: string;
  masterRating: number;
  meta: string;
  services: ServiziType[];
  distanceKm?: number;
};

type SelectedPortfolioPreview = {
  masterName: string;
  title: string;
  imageUrl: string;
};

function buildServiceCards(
  services: ServiziType[],
  categoryTitle: string,
  labels: {
    masterFallback: string;
    servicesFallback: string;
    priceFrom: (price: string) => string;
  },
): ServiceDirectoryCard[] {
  const activeServices = services.filter((service) => service.isActive);
  const visibleServices = activeServices.length > 0 ? activeServices : services;
  const servicesByMaster = new Map<number, ServiziType[]>();

  visibleServices.forEach((service) => {
    const masterServices = servicesByMaster.get(service.masterId) ?? [];
    servicesByMaster.set(service.masterId, [...masterServices, service]);
  });

  return Array.from(servicesByMaster.entries()).map(([masterId, masterServices]) => {
    const masterName = masterServices[0]?.masterName?.trim() || `${labels.masterFallback} #${masterId}`;
    const masterRating = Number(masterServices[0]?.masterRating ?? 0);
    const skillLabel = categoryTitle || labels.servicesFallback;
    const priceFrom = Math.min(...masterServices.map((service) => service.price));

    return {
      id: masterId,
      masterId,
      masterName,
      masterRating,
      meta: `${skillLabel} · ${labels.priceFrom(priceFrom.toLocaleString("ru-RU"))}`,
      services: masterServices,
    };
  });
}

export default function CategoryPage() {
  const t = useTranslations("services");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ categoryId: string }>();
  const searchParams = useSearchParams();
  const categoryId = params?.categoryId;
  const selectedServiceId = searchParams.get("serviceId");
  const user = useAppSelector((state) => state.user.user);
  const {
    search: searchNearbyMasters,
    loading: isNearbyLoading,
    error: nearbySearchError,
    clientLocation,
  } = useNearbySearch();

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
  const [masterProfilesById, setMasterProfilesById] = useState<Record<number, PublicMasterProfileType>>(
    {},
  );
  const [selectedPortfolioPreview, setSelectedPortfolioPreview] = useState<SelectedPortfolioPreview | null>(null);
  const [openingChatMasterId, setOpeningChatMasterId] = useState<number | null>(null);
  const [chatErrorByMaster, setChatErrorByMaster] = useState<Record<number, string | null>>({});
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [distanceByMaster, setDistanceByMaster] = useState<Record<number, number>>({});

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
        setError(loadError instanceof Error ? loadError.message : t("loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategoryPage();
  }, [categoryId, t]);

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

  const pageTitle =
    (selectedService
      ? getLocalizedTitle(selectedService, locale)
      : category
        ? getLocalizedTitle(category, locale)
        : null) ?? t("servicesFallback");

  const serviceCards = useMemo(
    () =>
      buildServiceCards(visibleServices, pageTitle, {
        masterFallback: t("masterFallback"),
        servicesFallback: t("servicesFallback"),
        priceFrom: (price) => t("priceFrom", { price }),
      }),
    [pageTitle, t, visibleServices],
  );

  const displayedServiceCards = useMemo(() => {
    if (!isNearbyMode) return serviceCards;

    return serviceCards
      .filter((card) => distanceByMaster[card.masterId] !== undefined)
      .map((card) => ({
        ...card,
        distanceKm: distanceByMaster[card.masterId],
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [distanceByMaster, isNearbyMode, serviceCards]);

  const mapMasterPoints = useMemo(() => {
    return displayedServiceCards.flatMap((card) => {
      const profile = masterProfilesById[card.masterId]?.profile;
      const lat = profile?.latitude;
      const lon = profile?.longitude;

      if (typeof lat !== "number" || typeof lon !== "number") return [];

      return [
        {
          id: card.masterId,
          name: getLocalizedTitle(profile ?? {}, locale) || card.masterName,
          coords: [lat, lon] as [number, number],
          distanceKm: card.distanceKm,
        },
      ];
    });
  }, [displayedServiceCards, locale, masterProfilesById]);

  const mapCenter = clientLocation
    ? ([clientLocation.lat, clientLocation.lon] as [number, number])
    : (mapMasterPoints[0]?.coords ?? ([55.751244, 37.618423] as [number, number]));

  useEffect(() => {
    if (serviceCards.length === 0) return;

    // Подгружаем публичные профили только для тех мастеров, которых еще нет в локальном кеше
    const masterIdsToLoad = serviceCards
      .map((card) => card.masterId)
      .filter((masterId, index, list) => list.indexOf(masterId) === index)
      .filter((masterId) => !masterProfilesById[masterId]);

    if (masterIdsToLoad.length === 0) return;

    let isCancelled = false;

    const loadMasterProfiles = async () => {
      const results = await Promise.allSettled(
        masterIdsToLoad.map(async (masterId) => ({
          masterId,
          profile: await getPublicMasterProfile(masterId),
        })),
      );

      if (isCancelled) return;

      const nextProfiles = results.reduce<Record<number, PublicMasterProfileType>>((acc, result) => {
        if (result.status === "fulfilled") {
          acc[result.value.masterId] = result.value.profile;
        }

        return acc;
      }, {});

      if (Object.keys(nextProfiles).length > 0) {
        setMasterProfilesById((prev) => ({ ...prev, ...nextProfiles }));
      }
    };

    void loadMasterProfiles();

    return () => {
      isCancelled = true;
    };
  }, [masterProfilesById, serviceCards]);

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
        [masterId]: loadError instanceof Error ? loadError.message : t("reviewsError"),
      }));
    } finally {
      setReviewsLoadingByMaster((prev) => ({ ...prev, [masterId]: false }));
    }
  };

  const handleOpenDirectChat = async (masterId: number) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      setOpeningChatMasterId(masterId);
      setChatErrorByMaster((prev) => ({ ...prev, [masterId]: null }));
      await openDirectChat(router, masterId);
    } catch (chatError) {
      setChatErrorByMaster((prev) => ({
        ...prev,
        [masterId]: chatError instanceof Error ? chatError.message : t("chatError"),
      }));
    } finally {
      setOpeningChatMasterId(null);
    }
  };

  const handleFindNearby = async () => {
    const mastersWithGeo = serviceCards.flatMap((card) => {
      const profile = masterProfilesById[card.masterId]?.profile;
      const lat = profile?.latitude;
      const lon = profile?.longitude;

      if (typeof lat !== "number" || typeof lon !== "number") return [];

      return [
        {
          id: card.masterId,
          categoryIds: Array.from(new Set(card.services.map((service) => service.categoryId))),
          lat,
          lon,
        },
      ];
    });

    if (mastersWithGeo.length === 0) {
      setNearbyError("У мастеров этой категории пока не указана точка на карте");
      setIsNearbyMode(false);
      setDistanceByMaster({});
      return;
    }

    setNearbyError(null);
    const results = await searchNearbyMasters({
      categoryId: Number(categoryId),
      radiusKm: 15,
      masters: mastersWithGeo,
    });

    if (results.length === 0) {
      setNearbyError("Рядом с вами пока не найдено мастеров в радиусе 15 км");
      setDistanceByMaster({});
      setIsNearbyMode(true);
      return;
    }

    setDistanceByMaster(
      Object.fromEntries(results.map((result) => [result.id, result.distanceKm])),
    );
    setIsNearbyMode(true);
  };

  const handleResetNearby = () => {
    setIsNearbyMode(false);
    setDistanceByMaster({});
    setNearbyError(null);
  };

  return (
    <main className="services-directory-page">
      <div className="services-directory-shell">
        <section
          className="services-directory-hero"
          style={{ backgroundImage: `linear-gradient(135deg, rgba(255, 252, 251, 0.65), rgba(255, 240, 241, 0.28)), url("/фон3.jpeg")` }}
        >
          <div className="services-directory-hero-copy glass-surface">
            <span className="services-directory-eyebrow">{t("category")}</span>
            <h1>{pageTitle}</h1>
          </div>
          <Link className="glass-button services-directory-back" href="/">
            {t("backHome")}
          </Link>
        </section>

        {isLoading ? (
          <section className="services-directory-state glass-surface">
            <p>{t("loading")}</p>
          </section>
        ) : null}

        {error ? (
          <section className="services-directory-state glass-surface">
            <p>{error}</p>
          </section>
        ) : null}

        {!isLoading && !error && serviceCards.length === 0 ? (
          <section className="services-directory-state glass-surface">
            <p>{t("empty")}</p>
          </section>
        ) : null}

        {!isLoading && !error && serviceCards.length > 0 ? (
          <section className="services-directory-nearby glass-surface">
            <div className="services-directory-nearby-copy">
              <strong>Мастера рядом с вами</strong>
              <span>
                Запросим вашу геопозицию и отсортируем мастеров этой категории по расстоянию
              </span>
            </div>
            <div className="services-directory-nearby-actions">
              <button
                className="services-directory-badge"
                disabled={isNearbyLoading}
                type="button"
                onClick={() => {
                  void handleFindNearby();
                }}
              >
                {isNearbyLoading ? commonT("loading") : "Найти рядом"}
              </button>
              {isNearbyMode ? (
                <button
                  className="services-directory-badge services-directory-badge--light"
                  type="button"
                  onClick={handleResetNearby}
                >
                  Показать всех
                </button>
              ) : null}
            </div>
            {nearbySearchError || nearbyError ? (
              <p className="services-directory-nearby-error">
                {nearbySearchError ?? nearbyError}
              </p>
            ) : null}
          </section>
        ) : null}

        {!isLoading && !error && mapMasterPoints.length > 0 ? (
          <section className="services-directory-map glass-surface">
            <YandexMastersMap
              center={mapCenter}
              clientLocation={clientLocation}
              isNearbyMode={isNearbyMode}
              points={mapMasterPoints}
            />
          </section>
        ) : null}

        {!isLoading && !error && serviceCards.length > 0 ? (
          <section className="services-directory-grid">
            {displayedServiceCards.map((card) => {
              const isReviewsOpen = expandedReviewsMasterId === card.masterId;
              const reviews = reviewsByMaster[card.masterId] ?? [];
              const isReviewsLoading = reviewsLoadingByMaster[card.masterId] ?? false;
              const reviewsError = reviewsErrorByMaster[card.masterId] ?? null;
              const masterProfile = masterProfilesById[card.masterId];
              // Аватар и мини-портфолио берутся из публичного профиля мастера, а не из самой услуги
              const avatarUrl = getMasterAvatarUrl(card.masterId, masterProfile?.user.avatar);
              const portfolioItems = expandPortfolioItems(masterProfile?.portfolio ?? []).slice(0, 4);
              const masterDisplayName =
                getLocalizedTitle(masterProfile?.profile ?? {}, locale) || card.masterName;
              const masterInitial = masterDisplayName.trim().slice(0, 1).toUpperCase();

              return (
                <article className="services-directory-card glass-surface" key={card.id}>
                  <div className="services-directory-card-head">
                    <div className="services-directory-card-master">
                      <div className="services-directory-card-avatar">
                        {avatarUrl ? (
                          <Image
                            className="services-directory-card-avatar-image"
                            src={avatarUrl}
                            alt={t("avatarAlt", { name: masterDisplayName })}
                            width={58}
                            height={58}
                            unoptimized
                          />
                        ) : (
                          <span>{masterInitial}</span>
                        )}
                      </div>
                      <div className="services-directory-card-head-copy">
                        <strong>{masterDisplayName}</strong>
                        <span>{card.meta}</span>
                      </div>
                    </div>
                    <div className="services-directory-card-rating" aria-label={t("ratingLabel", { rating: card.masterRating })}>
                      <span className="services-directory-card-rating-star">★</span>
                      <strong>{card.masterRating.toFixed(1)}</strong>
                    </div>
                  </div>

                  <div className="services-directory-badges">
                    {card.distanceKm !== undefined ? (
                      <DistanceBadge distanceKm={card.distanceKm} />
                    ) : null}
                    <Link
                      className="services-directory-badge services-directory-badge-link"
                      href={`/masters/${card.masterId}`}
                    >
                      {t("masterProfile")}
                    </Link>
                    <button
                      className={`services-directory-badge${isReviewsOpen ? " is-active" : ""}`}
                      type="button"
                      onClick={() => {
                        void handleToggleReviews(card.masterId);
                      }}
                    >
                      {t("reviews")}
                    </button>
                    <button
                      className="services-directory-badge"
                      disabled={openingChatMasterId === card.masterId}
                      type="button"
                      onClick={() => {
                        void handleOpenDirectChat(card.masterId);
                      }}
                    >
                      {openingChatMasterId === card.masterId ? commonT("opening") : commonT("write")}
                    </button>
                  </div>

                  {chatErrorByMaster[card.masterId] ? (
                    <p className="services-directory-card-error">
                      {chatErrorByMaster[card.masterId]}
                    </p>
                  ) : null}

                  {isReviewsOpen ? (
                    <div className="services-reviews-dropdown">
                      {isReviewsLoading ? (
                        <p className="services-reviews-state">{t("loadingReviews")}</p>
                      ) : null}

                      {!isReviewsLoading && reviewsError ? (
                        <p className="services-reviews-state">{reviewsError}</p>
                      ) : null}

                      {!isReviewsLoading && !reviewsError && reviews.length === 0 ? (
                        <p className="services-reviews-state">{t("noReviews")}</p>
                      ) : null}

                      {!isReviewsLoading && !reviewsError && reviews.length > 0 ? (
                        <div className="services-reviews-list">
                          {reviews.map((review) => (
                            <article className="services-reviews-card" key={review.id}>
                              <div className="services-reviews-card-head">
                                <strong>{t("clientNumber", { id: review.clientId })}</strong>
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

                  {portfolioItems.length > 0 ? (
                    <div className="services-directory-portfolio">
                      <div className="services-directory-portfolio-head">
                        <strong>{t("masterPortfolio")}</strong>
                      </div>
                      <div className="services-directory-portfolio-grid">
                        {portfolioItems.map((item) => (
                          <button
                            className="services-directory-portfolio-item"
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setSelectedPortfolioPreview({
                                masterName: masterDisplayName,
                                title: item.title || t("workTitle", { name: masterDisplayName }),
                                imageUrl: getMediaUrl(item.imageUrl),
                              })
                            }
                          >
                            <Image
                              src={getMediaUrl(item.imageUrl)}
                              alt={item.title || t("workTitle", { name: masterDisplayName })}
                              width={220}
                              height={220}
                              unoptimized
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <button
                    className="services-directory-card-button"
                    type="button"
                    onClick={() =>
                      dispatchBookingModalOpen({
                        categoryId: Number(categoryId),
                        categoryTitle: category?.title ?? t("servicesFallback"),
                        categoryTitleEn: category?.titleEn ?? null,
                        masterId: card.masterId,
                        masterName: masterDisplayName,
                        services: card.services,
                      })
                    }
                  >
                    {t("book")}
                  </button>
                </article>
              );
            })}
          </section>
        ) : null}
      </div>

      {selectedPortfolioPreview ? (
        <div
          className="services-directory-preview-backdrop"
          role="presentation"
          onClick={() => setSelectedPortfolioPreview(null)}
        >
          <div
            className="services-directory-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPortfolioPreview.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="services-directory-preview-close"
              type="button"
              aria-label={t("closePreview")}
              onClick={() => setSelectedPortfolioPreview(null)}
            >
              ×
            </button>
            <Image
              className="services-directory-preview-image"
              src={selectedPortfolioPreview.imageUrl}
              alt={selectedPortfolioPreview.title}
              width={980}
              height={760}
              unoptimized
            />
            <div className="services-directory-preview-caption">
              <strong>{selectedPortfolioPreview.masterName}</strong>
              <span>{selectedPortfolioPreview.title}</span>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
