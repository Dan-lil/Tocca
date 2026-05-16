"use client";

import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";

import type { MasterItem } from "@/features/booking/model/booking.data";

// Модальное окно хранит только разметку и обработчики сценария записи,
// а состояние получает снаружи от главной страницы

type BookingModalProps = {
  draft: string;
  inputRef: RefObject<HTMLInputElement | null>;
  masters: MasterItem[];
  quickPrompts: string[];
  onBackdropClick: () => void;
  onDraftChange: (value: string) => void;
  onPromptClick: (prompt: string) => void;
};

export function BookingModal({
  draft,
  inputRef,
  masters,
  quickPrompts,
  onBackdropClick,
  onDraftChange,
  onPromptClick,
}: BookingModalProps) {
  // Имитация отправки запроса: сейчас просто очищает поле ввода
  const handleSubmitDraft = () => {
    onDraftChange("");
  };

  // Позволяет отправить запрос по Enter прямо из поля ввода
  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitDraft();
    }
  };

  return (
    // Модальное окно записи через AI-помощника
    <div
      className="chat-modal-backdrop"
      role="presentation"
      onClick={onBackdropClick}
    >
      <section
        className="booking-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="booking-intro">
          <p>
            Маникюр — хороший выбор! Нашел 2 мастера на 15 мая, после 18:00.
            Выберите удобный слот:
          </p>
        </div>

        <div className="booking-masters">
          {masters.map((master) => (
            // Карточка доступного мастера с примером свободного слота
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
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Хочу маникюр завтра после 18:00..."
            />
            <button
              className="booking-ai-button"
              type="button"
              onClick={handleSubmitDraft}
            >
              Записаться
            </button>
          </div>

          <div className="booking-ai-chips">
            {quickPrompts.map((prompt) => (
              // Быстрая подстановка готового запроса в поле ввода
              <button
                className="booking-chip"
                key={prompt}
                type="button"
                onClick={() => onPromptClick(prompt)}
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
