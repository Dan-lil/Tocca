"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import "./page.css";
import { masters, quickPrompts } from '@/features/booking/model/booking.data'; //данные для модалки (пока нет сервака? - заглушка)
import { BookingModal } from "@/features/booking/ui/BookingModal"; //модалка AI
import { promotions } from "@/features/promotions/model/promotions.data"; //данные для акций
import { PromotionsSection } from "@/features/promotions/ui/PromotionsSection"; //код с блоком акций

// Главная страница собирает домашний экран из локальной витрины услуг, блока акций и модального окна (вынесены отдельно в фичи)

// карточки услуг
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
  // Состояние модального окна и текста в AI-помощнике
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState("Хочу маникюр завтра после 18:00...");

  // Ref для возврата фокуса в поле после выбора быстрой подсказки
  const inputRef = useRef<HTMLInputElement | null>(null);

  // блокировка страницы, пока открыто модальное окно
  useEffect(() => {
    document.body.style.overflow = isChatOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  // закрыть модальное окно записи по клавише Esc
  useEffect(() => {
    if (!isChatOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChatOpen]);

  // подставить выбранную подсказку в поле ввода и сразу возвращает туда фокус
  const handlePromptClick = (prompt: string) => {
    setDraft(prompt);
    inputRef.current?.focus();
  };

  return (
    <main className="home-page">
      <div className="page-shell">
        {/* блок с услугами и плашкой AI */}
        <section className="services-section">
          <div className="hero-assistant-card">
            <div className="assistant-badge">AI</div>
            <div className="assistant-copy">
              <strong>AI - помощник</strong>
              <span>Опишите, что вы хотите - я найду подходящих мастеров</span>
            </div>
            <button
              className="small-button"
              type="button"
              onClick={() => setIsChatOpen(true)}
            >
              Записаться
            </button>
          </div>

          <div className="section-heading">
            <span>Услуги</span>
          </div>

          <div className="services-grid">
            {services.map((service) => (
              // Карточка отдельной услуги
              <article className="service-card" key={service.title}>
                <div className="service-media">
                  <Image src={service.image} alt={service.title} fill />
                </div>
                <div className="service-overlay">
                  <Link
                    className="glass-button glass-button--compact service-title-link"
                    href="#"
                  >
                    {service.title}
                  </Link>
                  <p>{service.description}</p>
                  <button
                    className="card-button glass-button glass-button--compact"
                    type="button"
                  >
                    Записаться
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        {/* акции (код лежит в фичах) */}
        <PromotionsSection promotions={promotions} />
      </div>

      {/* кнопка открывает запись с помощью AI (обдщая для всей стр) */}
      <button
        className="chat-fab"
        type="button"
        onClick={() => setIsChatOpen(true)}
      >
        <span>AI</span>
      </button>
      {/* блок модального окна AI (лежит отдельно в фичах) */}
      {isChatOpen ? (
        <BookingModal
          draft={draft}
          inputRef={inputRef}
          masters={masters}
          quickPrompts={quickPrompts}
          onBackdropClick={() => setIsChatOpen(false)}
          onDraftChange={setDraft}
          onPromptClick={handlePromptClick}
        />
      ) : null}
    </main>
  );
}
