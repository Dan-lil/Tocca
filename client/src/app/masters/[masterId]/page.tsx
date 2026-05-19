"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import "./page.css";
import { getPublicMasterProfile } from "@/shared/api/profileMasterApi";
import { getServicesByMaster } from "@/shared/api/serviziApi";
import { PublicMasterProfileType, ServiziType } from "@/shared/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

function getMediaUrl(value?: string | null) {
  if (!value) return "";

  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

export default function PublicMasterPage() {
  const params = useParams<{ masterId: string }>();
  const masterId = params?.masterId;

  const [master, setMaster] = useState<PublicMasterProfileType | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!masterId) return;

    const loadMaster = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [masterData, servicesData] = await Promise.all([
          getPublicMasterProfile(masterId),
          getServicesByMaster(masterId),
        ]);

        setMaster(masterData);
        setServices(servicesData.filter((service) => service.isActive));
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Не удалось загрузить профиль мастера",
        );
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
          {master.user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="public-master-avatar"
              src={getMediaUrl(master.user.avatar)}
              alt="Фото мастера"
            />
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
          <h2>Портфолио</h2>
          {master.portfolio.length === 0 ? (
            <p>Портфолио пока пусто.</p>
          ) : (
            <div className="public-master-portfolio">
              {master.portfolio.map((item) => (
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
