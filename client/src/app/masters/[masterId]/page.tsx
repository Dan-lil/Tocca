"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import "./page.css";
import { getReviewsByMaster } from "@/shared/api/ecoApi";
import { getPublicMasterProfile } from "@/shared/api/profileMasterApi";
import { getServicesByMaster } from "@/shared/api/serviziApi";
import { useAppSelector } from "@/shared/hooks/useReduxHooks";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import {
  getLocalizedCategory,
  getLocalizedDescription,
  getLocalizedTitle,
} from "@/shared/lib/localized";
import { openDirectChat } from "@/shared/lib/openDirectChat";
import { expandPortfolioItems, getMasterAvatarUrl, getMediaUrl } from "@/shared/lib/media";
import type { EcoReviewType, PublicMasterProfileType, ServiziType } from "@/shared/types";

export default function PublicMasterPage() {
  const t = useTranslations("master");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams<{ masterId: string }>();
  const masterId = params?.masterId;
  const user = useAppSelector((state) => state.user.user);

  const [master, setMaster] = useState<PublicMasterProfileType | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [reviews, setReviews] = useState<EcoReviewType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!masterId) return;

    const loadMaster = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [masterData, servicesResult, reviewsResult] = await Promise.all([
          getPublicMasterProfile(masterId),
          getServicesByMaster(masterId).catch(() => []),
          getReviewsByMaster(masterId).catch(() => []),
        ]);

        setMaster(masterData);
        setServices(servicesResult.filter((service) => service.isActive));
        setReviews(reviewsResult);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t("loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    void loadMaster();
  }, [masterId, t]);

  const masterName = useMemo(() => {
    if (!master) return t("profile");

    return getLocalizedTitle(master.profile ?? {}, locale)?.trim() || master.user.name || t("fallbackName");
  }, [locale, master, t]);

  const handleOpenDirectChat = async () => {
    const numericMasterId = Number(masterId);

    if (!user) {
      router.push("/auth");
      return;
    }

    if (!Number.isInteger(numericMasterId)) return;

    try {
      setIsOpeningChat(true);
      setChatError(null);
      await openDirectChat(router, numericMasterId);
    } catch (openError) {
      setChatError(openError instanceof Error ? openError.message : t("chatError"));
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleOpenBooking = () => {
    const numericMasterId = Number(masterId);

    if (!user) {
      router.push("/auth");
      return;
    }

    if (!Number.isInteger(numericMasterId) || !master) return;

    const categoryTitle =
      getLocalizedCategory(master.profile ?? {}, locale) ||
      getLocalizedTitle(services[0] ?? {}, locale) ||
      t("services");

    dispatchBookingModalOpen({
      categoryId: services[0]?.categoryId,
      categoryTitle,
      categoryTitleEn: master.profile?.categoryEn ?? null,
      masterId: numericMasterId,
      masterName,
      services,
    });
  };

  // На публичной странице мастера сначала пробуем локальный аватар из public/avatar
  const resolvedMasterId = Number(masterId);
  const avatarUrl =
    master && !Number.isNaN(resolvedMasterId)
      ? getMasterAvatarUrl(resolvedMasterId, master.user.avatar)
      : "";
  const portfolioItems = expandPortfolioItems(master?.portfolio ?? []);

  if (isLoading) {
    return (
      <main className="public-master-page">
        <section className="public-master-state glass-surface">{t("loading")}</section>
      </main>
    );
  }

  if (error || !master) {
    return (
      <main className="public-master-page">
        <section className="public-master-state glass-surface">
          <p>{error ?? t("notFound")}</p>
          <div className="public-master-actions">
            <button
              className="glass-button public-master-back"
              disabled={isOpeningChat}
              type="button"
              onClick={() => {
                void handleOpenDirectChat();
              }}
            >
              {isOpeningChat ? commonT("opening") : commonT("write")}
            </button>
            <Link className="glass-button public-master-back" href="/">
              {commonT("backHome")}
            </Link>
          </div>
        </section>

        {chatError ? <p className="public-master-error">{chatError}</p> : null}
      </main>
    );
  }

  return (
    <main className="public-master-page">
      <div className="public-master-shell">
        <section className="public-master-hero glass-surface">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="public-master-avatar" src={avatarUrl} alt={t("photoAlt")} />
          ) : (
            <div className="public-master-avatar public-master-avatar--empty">
              {masterName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="public-master-hero-copy">
            <span>{t("profile")}</span>
            <h1>{masterName}</h1>
            <p>{getLocalizedDescription(master.profile ?? {}, locale) || t("descriptionEmpty")}</p>
          </div>

          <div className="public-master-actions">
            {user?.role !== "master" ? (
              <button
                className="glass-button public-master-back"
                type="button"
                onClick={handleOpenBooking}
              >
                {t("book")}
              </button>
            ) : null}
            <button
              className="glass-button public-master-back"
              disabled={isOpeningChat}
              type="button"
              onClick={() => {
                void handleOpenDirectChat();
              }}
            >
              {isOpeningChat ? commonT("opening") : commonT("write")}
            </button>
            <Link className="glass-button public-master-back" href="/">
              {commonT("backHome")}
            </Link>
          </div>
        </section>

        {chatError ? <p className="public-master-error">{chatError}</p> : null}

        <section className="public-master-summary">
          <div>
            <span>{t("rating")}</span>
            <strong>{Number(master.profile?.rating ?? 0).toFixed(1)}</strong>
          </div>
          <div>
            <span>{t("city")}</span>
            <strong>{master.profile?.city || commonT("notSpecifiedMale")}</strong>
          </div>
          <div>
            <span>{t("address")}</span>
            <strong>{master.profile?.address || commonT("notSpecifiedMale")}</strong>
          </div>
          <div>
            <span>{t("experience")}</span>
            <strong>{master.profile?.experience ?? 0} {commonT("years")}</strong>
          </div>
        </section>

        <section className="public-master-section glass-surface">
          <h2>{t("socials")}</h2>
          {!master.socials || master.socials.length === 0 ? (
            <p>{t("socialsEmpty")}</p>
          ) : (
            <div className="public-master-socials">
              {master.socials.map((social) => (
                <a
                  className="public-master-social-link"
                  href={social.contact}
                  key={social.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{social.network}</span>
                  <strong>{social.contact}</strong>
                </a>
              ))}
            </div>
          )}
        </section>

        <section className="public-master-section glass-surface">
          <h2>{t("services")}</h2>
          {services.length === 0 ? (
            <p>{t("servicesEmpty")}</p>
          ) : (
            <div className="public-master-services">
              {services.map((service) => (
                <article className="public-master-service" key={service.id}>
                  <div>
                    <strong>{getLocalizedTitle(service, locale) ?? service.title}</strong>
                    <p>{getLocalizedDescription(service, locale) || t("serviceDescriptionEmpty")}</p>
                  </div>
                  <span>{service.price.toLocaleString("ru-RU")} {commonT("currencyRub")}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="public-master-section glass-surface">
          <h2>{t("reviews")}</h2>
          {reviews.length === 0 ? (
            <p>{t("reviewsEmpty")}</p>
          ) : (
            <div className="public-master-reviews">
              {reviews.map((review) => (
                <article className="public-master-review" key={review.id}>
                  <div className="public-master-review-head">
                    <strong>{t("clientNumber", { id: review.clientId })}</strong>
                    <span>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(Math.max(0, 5 - review.rating))}
                    </span>
                  </div>
                  <p>{review.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="public-master-section glass-surface">
          <h2>{t("portfolio")}</h2>
          {portfolioItems.length === 0 ? (
            <p>{t("portfolioEmpty")}</p>
          ) : (
            <div className="public-master-portfolio">
              {portfolioItems.map((item) => (
                <article className="public-master-work" key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMediaUrl(item.imageUrl)} alt={item.title || t("workPhoto")} />
                  {item.title ? <p>{item.title}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
