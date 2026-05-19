"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import "./page.css";
import { getReviewsByMaster } from "@/shared/api/ecoApi";
import { getPublicMasterProfile } from "@/shared/api/profileMasterApi";
import { getServicesByMaster } from "@/shared/api/serviziApi";
import { expandPortfolioItems, getMasterAvatarUrl, getMediaUrl } from "@/shared/lib/media";
import type { EcoReviewType, PublicMasterProfileType, ServiziType } from "@/shared/types";

export default function PublicMasterPage() {
  const params = useParams<{ masterId: string }>();
  const masterId = params?.masterId;

  const [master, setMaster] = useState<PublicMasterProfileType | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [reviews, setReviews] = useState<EcoReviewType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!masterId) return;

    const loadMaster = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [masterData, servicesData, reviewsData] = await Promise.all([
          getPublicMasterProfile(masterId),
          getServicesByMaster(masterId),
          getReviewsByMaster(masterId),
        ]);

        setMaster(masterData);
        setServices(servicesData.filter((service) => service.isActive));
        setReviews(reviewsData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить профиль мастера");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMaster();
  }, [masterId]);

  const masterName = useMemo(() => {
    if (!master) return "Профиль мастера";

    return master.profile?.title?.trim() || master.user.name || "Мастер";
  }, [master]);

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
        <section className="public-master-state glass-surface">Загружаю профиль мастера...</section>
      </main>
    );
  }

  if (error || !master) {
    return (
      <main className="public-master-page">
        <section className="public-master-state glass-surface">
          <p>{error ?? "Профиль мастера не найден"}</p>
          <Link className="glass-button public-master-back" href="/">
            На главную
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="public-master-page">
      <div className="public-master-shell">
        <section className="public-master-hero glass-surface">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="public-master-avatar" src={avatarUrl} alt="Фото мастера" />
          ) : (
            <div className="public-master-avatar public-master-avatar--empty">
              {masterName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="public-master-hero-copy">
            <span>Профиль мастера</span>
            <h1>{masterName}</h1>
            <p>{master.profile?.description || "Мастер пока не добавил описание профиля."}</p>
          </div>

          <Link className="glass-button public-master-back" href="/">
            На главную
          </Link>
        </section>

        <section className="public-master-summary">
          <div>
            <span>Рейтинг</span>
            <strong>{Number(master.profile?.rating ?? 0).toFixed(1)}</strong>
          </div>
          <div>
            <span>Город</span>
            <strong>{master.profile?.city || "Не указан"}</strong>
          </div>
          <div>
            <span>Адрес</span>
            <strong>{master.profile?.address || "Не указан"}</strong>
          </div>
          <div>
            <span>Опыт</span>
            <strong>{master.profile?.experience ?? 0} лет</strong>
          </div>
        </section>

        <section className="public-master-section glass-surface">
          <h2>Социальные сети</h2>
          {!master.socials || master.socials.length === 0 ? (
            <p>Мастер пока не указал социальные сети.</p>
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
          <h2>Услуги мастера</h2>
          {services.length === 0 ? (
            <p>У мастера пока нет активных услуг.</p>
          ) : (
            <div className="public-master-services">
              {services.map((service) => (
                <article className="public-master-service" key={service.id}>
                  <div>
                    <strong>{service.title}</strong>
                    <p>{service.description || "Описание услуги скоро появится."}</p>
                  </div>
                  <span>{service.price.toLocaleString("ru-RU")} руб.</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="public-master-section glass-surface">
          <h2>Отзывы</h2>
          {reviews.length === 0 ? (
            <p>У мастера пока нет отзывов.</p>
          ) : (
            <div className="public-master-reviews">
              {reviews.map((review) => (
                <article className="public-master-review" key={review.id}>
                  <div className="public-master-review-head">
                    <strong>Клиент #{review.clientId}</strong>
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
          <h2>Портфолио</h2>
          {portfolioItems.length === 0 ? (
            <p>Портфолио пока пусто.</p>
          ) : (
            <div className="public-master-portfolio">
              {portfolioItems.map((item) => (
                <article className="public-master-work" key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMediaUrl(item.imageUrl)} alt={item.title || "Фото работы мастера"} />
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
