"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { createBooking } from "@/shared/api/bookingApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import { BOOKING_MODAL_EVENT } from "@/shared/lib/bookingEvents";
import { BookingModalPayload } from "@/shared/types";
import { getMockOptionsByPrompt, quickPrompts, type MasterItem } from "./booking.data";

type BookingFlowStep = "idle" | "searching" | "options" | "confirmed";
type ChatMessage = {
  id: number;
  text: string;
  role: "ai" | "user";
  placement: "top" | "bottom";
};
type DirectBookingFormState = {
  comment: string;
};

// Тексты вынесены в константы
const DEFAULT_DRAFT = "Хочу маникюр завтра после 18:00";
const DEFAULT_AI_MESSAGE = "Напишите запрос, например «хочу маникюр на завтра»";
const initialDirectBookingForm: DirectBookingFormState = { comment: "" };

export default function GlobalBookingModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isInitialized } = useAppSelector((state) => state.user);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [presetBooking, setPresetBooking] = useState<BookingModalPayload | null>(null);
  const [step, setStep] = useState<BookingFlowStep>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<MasterItem[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, text: DEFAULT_AI_MESSAGE, role: "ai", placement: "top" },
  ]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedOption, setConfirmedOption] = useState<MasterItem | null>(null);
  const [directBookingForm, setDirectBookingForm] = useState(initialDirectBookingForm);
  const [isDirectBookingLoading, setIsDirectBookingLoading] = useState(false);
  const [directBookingError, setDirectBookingError] = useState<string | null>(null);
  const [directBookingSuccess, setDirectBookingSuccess] = useState<string | null>(null);

  // Ref нужен, чтобы возвращать фокус в поле ввода после выбора подсказки
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextMessageIdRef = useRef(2);

  useEffect(() => {
    dispatch(refreshTokenThunk());
  }, [dispatch]);

  useEffect(() => {
    // Слушаем открытие модалки из любых частей интерфейса
    const handleOpenBookingModal = (event: Event) => {
      const customEvent = event as CustomEvent<BookingModalPayload | undefined>;

      setPresetBooking(customEvent.detail ?? null);
      setPendingOpen(true);
    };

    window.addEventListener(BOOKING_MODAL_EVENT, handleOpenBookingModal as EventListener);

    return () => {
      window.removeEventListener(BOOKING_MODAL_EVENT, handleOpenBookingModal as EventListener);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isChatOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  const resetModalState = useCallback(() => {
    // Возвращаем модалку в исходное состояние после закрытия
    setStep("idle");
    setIsLoading(false);
    setError(null);
    setOptions([]);
    setSelectedOptionId(null);
    setDraft(DEFAULT_DRAFT);
    setChatMessages([{ id: 1, text: DEFAULT_AI_MESSAGE, role: "ai", placement: "top" }]);
    setBookingConfirmed(false);
    setConfirmedOption(null);
    setPresetBooking(null);
    setDirectBookingForm(initialDirectBookingForm);
    setIsDirectBookingLoading(false);
    setDirectBookingError(null);
    setDirectBookingSuccess(null);
    nextMessageIdRef.current = 2;
  }, []);

  const closeModal = useCallback(() => {
    setIsChatOpen(false);
    resetModalState();
  }, [resetModalState]);

  useEffect(() => {
    if (!pendingOpen || !isInitialized) return;

    if (!user) {
      const redirectTimer = window.setTimeout(() => {
        router.push("/auth");
        setPendingOpen(false);
      }, 0);

      return () => {
        window.clearTimeout(redirectTimer);
      };
    }

    const openTimer = window.setTimeout(() => {
      setIsChatOpen(true);
      setPendingOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(openTimer);
    };
  }, [isInitialized, pendingOpen, router, user]);

  useEffect(() => {
    if (!isChatOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, isChatOpen]);

  const pushChatMessage = useCallback(
    // Все сообщения добавляем через одну функцию
    (text: string, role: "ai" | "user", placement: "top" | "bottom" = "top") => {
      const newMessage: ChatMessage = { id: nextMessageIdRef.current, text, role, placement };
      nextMessageIdRef.current += 1;
      setChatMessages((prev) => [...prev, newMessage]);
    },
    [],
  );

  const selectedOption = useMemo(
    // Вычисляем выбранный AI вариант один раз на основе id
    () => options.find((item) => item.id === selectedOptionId) ?? null,
    [options, selectedOptionId],
  );

  const handlePromptClick = (prompt: string) => {
    if (bookingConfirmed) return;

    setDraft(prompt);
    inputRef.current?.focus();
  };

  const handleSubmitDraft = async () => {
    if (bookingConfirmed) return;

    const prompt = draft.trim();

    if (!prompt) {
      setError("Введите запрос для подбора");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep("searching");
    setOptions([]);
    setSelectedOptionId(null);
    pushChatMessage(prompt, "user");
    pushChatMessage("Подбираю доступные варианты, это займет пару секунд", "ai");

    try {
      const found = await getMockOptionsByPrompt(prompt);
      setOptions(found);
      setStep("options");
      pushChatMessage(`По запросу «${prompt}» найдено ${found.length} вариантов, выберите подходящий`, "ai");
    } catch {
      setError("Не удалось подобрать варианты, попробуйте еще раз");
      setStep("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = () => {
    if (!selectedOption || step !== "options" || bookingConfirmed) return;

    setBookingConfirmed(true);
    setConfirmedOption(selectedOption);
    pushChatMessage(
      `Запись подтверждена к мастеру ${selectedOption.name} на ${selectedOption.slot}`,
      "ai",
      "bottom",
    );
    setStep("confirmed");
  };

  const handleDirectBookingCommentChange = (value: string) => {
    // Храним только комментарий, остальное сервер пока получит как технические значения
    setDirectBookingForm({ comment: value });
  };

  const handleDirectBookingSubmit = async () => {
    if (!presetBooking || !user) return;

    // Подставляем текущий момент и длительность услуги, пока сервер не отдает реальные слоты
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + presetBooking.duration * 60_000);

    try {
      setIsDirectBookingLoading(true);
      setDirectBookingError(null);
      setDirectBookingSuccess(null);

      await createBooking({
        clientId: user.id,
        masterId: presetBooking.masterId,
        serviziId: presetBooking.serviziId,
        date: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "pending",
        clientComment: directBookingForm.comment.trim() || undefined,
      });

      setDirectBookingSuccess("Запись отправлена мастеру");
    } catch (submitError) {
      setDirectBookingError(
        submitError instanceof Error
          ? submitError.message
          : "Не удалось отправить запись",
      );
    } finally {
      setIsDirectBookingLoading(false);
    }
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSubmitDraft();
    }
  };

  const shouldShowOptions = step === "options" || step === "confirmed";
  const shouldShowReview = step === "options" && !!selectedOption;
  const shouldShowConfirmedCard = step === "confirmed" && !!confirmedOption;
  const topMessages = chatMessages.filter((message) => message.placement === "top");
  const bottomMessages = chatMessages.filter((message) => message.placement === "bottom");
  const isPresetMode = !!presetBooking;

  if (!isChatOpen) return null;

  return (
    <div className="chat-modal-backdrop" role="presentation" onClick={closeModal}>
      <section className="booking-modal" onClick={(event) => event.stopPropagation()}>
        {isPresetMode ? (
          <div className="booking-direct-mode">
            <div className="booking-intro glass-surface">
              <p>Вы выбрали услугу и можете сразу отправить заявку мастеру</p>
            </div>

            {/* Этот сценарий открывается из карточек услуг, а не из AI поиска */}
            <article className="booking-direct-card glass-surface">
              <div className="booking-direct-card-head">
                <span className="master-avatar">{presetBooking.masterId}</span>
                <div className="master-head">
                  <strong>Мастер #{presetBooking.masterId}</strong>
                  <span>{presetBooking.categoryTitle}</span>
                </div>
              </div>

              <p className="booking-direct-service">{presetBooking.serviceTitle}</p>
              <p className="booking-direct-description">{presetBooking.serviceDescription}</p>
              <div className="booking-direct-meta">
                <span>{presetBooking.price.toLocaleString("ru-RU")} ₽</span>
                <span>{presetBooking.duration} мин</span>
              </div>
            </article>

            <div className="booking-direct-form glass-surface">
              <label className="booking-direct-field">
                <span>Комментарий</span>
                <textarea
                  className="booking-direct-textarea"
                  value={directBookingForm.comment}
                  onChange={(event) => handleDirectBookingCommentChange(event.target.value)}
                  placeholder="Напишите пожелания к визиту"
                  rows={4}
                />
              </label>

              {directBookingError ? (
                <p className="booking-direct-feedback booking-direct-feedback--error">
                  {directBookingError}
                </p>
              ) : null}

              {directBookingSuccess ? (
                <p className="booking-direct-feedback booking-direct-feedback--success">
                  {directBookingSuccess}
                </p>
              ) : null}

              <button
                className="booking-confirm-button"
                type="button"
                disabled={isDirectBookingLoading}
                onClick={() => void handleDirectBookingSubmit()}
              >
                {isDirectBookingLoading ? "Отправляю" : "Отправить запись"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Этот сценарий оставляет старый AI подбор мастеров */}
            <div className="booking-chat-thread">
              {topMessages.map((message) => (
                <div
                  key={message.id}
                  className={`booking-intro glass-surface ${message.role === "user" ? "booking-intro--user" : "booking-intro--ai"}`}
                >
                  <p>{message.text}</p>
                </div>
              ))}
            </div>

            {shouldShowOptions ? (
              <div className="booking-masters">
                {options.map((master) => {
                  const isSelected = selectedOptionId === master.id;

                  return (
                    <button
                      className="master-card glass-surface"
                      key={master.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedOptionId(master.id)}
                      style={isSelected ? { outline: "2px solid rgba(255, 255, 255, 0.98)" } : undefined}
                    >
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
                  );
                })}
              </div>
            ) : null}

            {shouldShowReview ? (
              <div className="booking-confirm">
                <p className="booking-confirm-title">Проверьте выбранный вариант</p>

                <article className="booking-summary-card glass-surface">
                  <div className="master-topline">
                    <span className="master-avatar">{selectedOption?.initials}</span>
                    <div className="master-head">
                      <strong>{selectedOption?.name}</strong>
                      <span>{selectedOption?.service}</span>
                    </div>
                  </div>
                  <p className="booking-summary-time">{selectedOption?.slot}</p>
                  <p className="booking-summary-price">{selectedOption?.price}</p>
                </article>

                <button
                  className="booking-confirm-button"
                  type="button"
                  onClick={handleConfirmBooking}
                >
                  Подтвердить запись
                </button>
              </div>
            ) : null}

            {shouldShowConfirmedCard ? (
              <div className="booking-confirm">
                <p className="booking-confirm-title">Подтвержденная запись</p>

                <article className="booking-summary-card glass-surface">
                  <div className="master-topline">
                    <span className="master-avatar">{confirmedOption?.initials}</span>
                    <div className="master-head">
                      <strong>{confirmedOption?.name}</strong>
                      <span>{confirmedOption?.service}</span>
                    </div>
                  </div>
                  <p className="booking-summary-time">{confirmedOption?.slot}</p>
                  <p className="booking-summary-price">{confirmedOption?.price}</p>
                </article>
              </div>
            ) : null}

            {bottomMessages.length > 0 ? (
              <div className="booking-chat-thread">
                {bottomMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`booking-intro glass-surface ${message.role === "user" ? "booking-intro--user" : "booking-intro--ai"}`}
                  >
                    <p>{message.text}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="booking-ai-panel">
              <div className="booking-ai-head">
                <div className="assistant-badge booking-ai-badge">AI</div>
                <div className="booking-ai-copy">
                  <strong>AI - помощник</strong>
                  <span>Опишите, что вы хотите, а я подберу варианты</span>
                </div>
              </div>

              <div className="booking-ai-input-row">
                <input
                  ref={inputRef}
                  className="booking-ai-input"
                  value={draft}
                  onChange={(event) => {
                    if (bookingConfirmed) return;
                    setDraft(event.target.value);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder={DEFAULT_DRAFT}
                  disabled={bookingConfirmed}
                />
                <button
                  className="booking-ai-button"
                  type="button"
                  onClick={() => void handleSubmitDraft()}
                  disabled={isLoading || bookingConfirmed}
                >
                  {isLoading ? "Ищу" : "Подобрать"}
                </button>
              </div>

              {error ? <p className="master-meta">{error}</p> : null}

              <div className="booking-ai-chips">
                {quickPrompts.map((prompt) => (
                  <button
                    className="booking-chip"
                    key={prompt}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    disabled={bookingConfirmed}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
