"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";

import "./page.css";
import { promotions } from "@/features/promotions/model/promotions.data";//заглушки для акций
import { PromotionsSection } from "@/features/promotions/ui/PromotionsSection";//блок с акциями
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";

const services = [
  {
    title: "Ногти",
    image: "/услуги на главной/ногти9.jpg",
    description: "Уход, покрытие и дизайн",
  },
  {
    title: "Макияж",
    image: "/услуги на главной/макияж1.jpg",
    description: "Дневные и вечерние образы с естественным сиянием",
  },
  {
    title: "Массаж",
    image: "/услуги на главной/массаж8.jpg",
    description: "Расслабляющие ритуалы для тела и восстановления",
  },
  {
    title: "Косметология",
    image: "/услуги на главной/косметология11.jpg",
    description: "Процедуры для свежей кожи, ровного тона и твоей красоты",
  },
  {
    title: "Волосы",
    image: "/услуги на главной/прическа2.jpg",
    description:
      "Уход за волосами, укладки и прически под событие или настроение",
  },
];

export default function HomePage() {
  // Все AI кнопки на странице вызывают один и тот же сценарий модалки
  const handleAiClick = useCallback(() => {
    dispatchBookingModalOpen();
  }, []);

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

          <div className="services-grid">
            {services.map((service) => (
              // На главной пока оставляем статическую витрину услуг
              <article className="service-card" key={service.title}>
                <div className="service-media">
                  <Image src={service.image} alt={service.title} fill />
                </div>
                <div className="service-overlay">
                  <Link className="glass-button glass-button--compact service-title-link" href="#">
                    {service.title}
                  </Link>
                  <p>{service.description}</p>
                  <button className="card-button glass-button glass-button--compact" type="button">
                    Записаться
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
{/* подключаем блок с акциями */}
        <PromotionsSection promotions={promotions} />
      </div>

      <button className="chat-fab" type="button" onClick={handleAiClick}>
        <span>AI</span>
      </button>
    </main>
  );
}
