"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { masters, quickPrompts } from "./booking.data";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";

export default function GlobalBookingModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isInitialized } = useAppSelector((state) => state.user);

  // Локальное состояние модалки и поля ввода AI-помощника
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState("Хочу маникюр завтра после 18:00...");
  // Флаг "запрошено открытие": ждём, пока точно узнаем статус авторизации
  const [pendingOpen, setPendingOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Инициализируем пользовательскую сессию один раз при старте приложения
  useEffect(() => {
    dispatch(refreshTokenThunk());
  }, [dispatch]);

  // Открываем модалку только для авторизованных пользователей, иначе ведем на /auth
  useEffect(() => {
    if (!pendingOpen || !isInitialized) return;

    if (user) {
      setIsChatOpen(true);
    } else {
      router.push("/auth");
    }

    setPendingOpen(false);
  }, [isInitialized, pendingOpen, router, user]);

  useEffect(() => {
    // Слушаем AI из любых частей интерфейса
    const handleOpenBookingModal = () => {
      setPendingOpen(true);
    };

    window.addEventListener("open-booking-modal", handleOpenBookingModal);

    return () => {
      window.removeEventListener("open-booking-modal", handleOpenBookingModal);
    };
  }, []);

  useEffect(() => {
    // Блокируем прокрутку страницы, пока открыта модалка
    document.body.style.overflow = isChatOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen) return;

    // Закрытие модалки по Esc
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

  const handlePromptClick = (prompt: string) => {
    // Подставляем быстрый запрос и возвращаем фокус в поле для продолжения ввода
    setDraft(prompt);
    inputRef.current?.focus();
  };

  const handleSubmitDraft = () => {
    // Пока без API: имитируем отправку, очищая поле
    setDraft("");
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitDraft();
    }
  };

  if (!isChatOpen) return null;

  return (
    // Клик по фону закрывает модалку, клик внутри контента - нет
    <div className="chat-modal-backdrop" role="presentation" onClick={() => setIsChatOpen(false)}>
      <section className="booking-modal" onClick={(event) => event.stopPropagation()}>
        <div className="booking-intro">
          <p>
            Маникюр - хороший выбор! Нашел 2 мастера на 15 мая, после 18:00.
            Выберите удобный слот:
          </p>
        </div>

        <div className="booking-masters">
          {masters.map((master) => (
            <button className="master-card" key={master.id}>
              <div className="master-topline">
                <span className="master-avatar">{master.initials}</span>
                <div className="master-head">
                  <strong>{master.name}</strong>
                  <span>{master.meta}</span>
                </div>
              </div>
              <p className="master-service">{master.service}</p>
              <p className="master-meta">{master.price}</p>
              <p className="master-slot">{master.slot}</p>
            </button>
          ))}
        </div>

        <div className="booking-confirm">
          <p className="booking-confirm-title">Отлично! Вот ваша запись:</p>

          <article className="booking-summary-card">
            <div className="master-topline">
              <span className="master-avatar">АП</span>
              <div className="master-head">
                <strong>Анна Петрова</strong>
                <span>Маникюр с покрытием</span>
              </div>
            </div>
            <p className="booking-summary-time">15 мая, пятница, 19:00</p>
            <p className="booking-summary-price">2 500 ₽ • 90 мин</p>
          </article>

          <button className="booking-confirm-button" type="button">
            Подтвердить запись
          </button>
        </div>

        <div className="booking-ai-panel">
          <div className="booking-ai-head">
            <div className="assistant-badge booking-ai-badge">AI</div>
            <div className="booking-ai-copy">
              <strong>AI - помощник</strong>
              <span>Опишите, что вы хотите - я найду подходящих мастеров</span>
            </div>
          </div>

          <div className="booking-ai-input-row">
            <input
              ref={inputRef}
              className="booking-ai-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Хочу маникюр завтра после 18:00..."
            />
            <button className="booking-ai-button" type="button" onClick={handleSubmitDraft}>
              Записаться
            </button>
          </div>

          <div className="booking-ai-chips">
            {quickPrompts.map((prompt) => (
              <button
                className="booking-chip"
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
