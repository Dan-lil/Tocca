"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { getMockOptionsByPrompt, quickPrompts, type MasterItem } from "./booking.data";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";

type BookingFlowStep = "idle" | "searching" | "options" | "confirmed";
type ChatMessage = {
  id: number;
  text: string;
  role: "ai" | "user";
  placement: "top" | "bottom";
};

export default function GlobalBookingModal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isInitialized } = useAppSelector((state) => state.user);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState("Хочу маникюр завтра после 18:00");
  const [pendingOpen, setPendingOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

 
  const [step, setStep] = useState<BookingFlowStep>("idle"); // шаги клиентского AI-сценария
  const [isLoading, setIsLoading] = useState(false);// флаг загрузки во время имитации ответа AI
  const [error, setError] = useState<string | null>(null); // текст ошибки для пустого запроса или сбоя подбора
  const [options, setOptions] = useState<MasterItem[]>([]);// подобранные варианты мастеров из заглушки
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);// выбранный пользователем вариант
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Напишите запрос, например «хочу маникюр на завтра»", role: "ai", placement: "top" },
  ]);
  const nextMessageIdRef = useRef(2);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedOption, setConfirmedOption] = useState<MasterItem | null>(null);

  // Инициализируем пользовательскую сессию один раз при старте приложения
  useEffect(() => {
    dispatch(refreshTokenThunk());
  }, [dispatch]);

  // Открываем модалку только для авторизованных пользователей, иначе ведем на /auth
  useEffect(() => {
    if (!pendingOpen || !isInitialized) return;

    if (user) {
      const openTimer = window.setTimeout(() => {
        setIsChatOpen(true);
        setPendingOpen(false);
      }, 0);

      return () => window.clearTimeout(openTimer);
    }

    const redirectTimer = window.setTimeout(() => {
      router.push("/auth");
      setPendingOpen(false);
    }, 0);

    return () => window.clearTimeout(redirectTimer);
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

  const resetModalState = useCallback(() => {
    // После закрытия возвращаем окно в исходный вид
    setStep("idle");
    setIsLoading(false);
    setError(null);
    setOptions([]);
    setSelectedOptionId(null);
    setDraft("Хочу маникюр завтра после 18:00");
    setChatMessages([
      { id: 1, text: "Напишите запрос, например «хочу маникюр на завтра»", role: "ai", placement: "top" },
    ]);
    nextMessageIdRef.current = 2;
    setBookingConfirmed(false);
    setConfirmedOption(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsChatOpen(false);
    resetModalState();
  }, [resetModalState]);

  useEffect(() => {
    if (!isChatOpen) return;

    // Закрываем модалку по Esc
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

  const pushChatMessage = (text: string, role: "ai" | "user", placement: "top" | "bottom" = "top") => {
    const newMessage: ChatMessage = { id: nextMessageIdRef.current, text, role, placement };
    nextMessageIdRef.current += 1;
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const selectedOption = useMemo(
    // Находим выбранный объект мастера для блока подтверждения
    () => options.find((item) => item.id === selectedOptionId) ?? null,
    [options, selectedOptionId],
  );

  const handlePromptClick = (prompt: string) => {
    if (bookingConfirmed) return;

    // Быстрая подстановка подсказки в поле ввода
    setDraft(prompt);
    inputRef.current?.focus();
  };

  const mockAiSearch = async (prompt: string): Promise<MasterItem[]> => {
    // Имитируем сетевую задержку и ответ AI
    await new Promise((resolve) => setTimeout(resolve, 700));
    return getMockOptionsByPrompt(prompt);
  };

  const handleSubmitDraft = async () => {
    if (bookingConfirmed) return;

    // Берем только непустой запрос
    const prompt = draft.trim();

    if (!prompt) {
      setError("Введите запрос для подбора");
      return;
    }

    setIsLoading(true);
    setError(null);
    // Переходим в шаг поиска и очищаем прошлый результат
    setStep("searching");
    setOptions([]);
    setSelectedOptionId(null);
    pushChatMessage(prompt, "user");
    pushChatMessage("Подбираю доступные варианты, это займет пару секунд", "ai");

    try {
      const found = await mockAiSearch(prompt);
      setOptions(found);
      // После ответа показываем варианты для выбора
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

    // Финальный шаг подтверждения записи
    setBookingConfirmed(true);
    setConfirmedOption(selectedOption);
    pushChatMessage(
      `Запись подтверждена к мастеру ${selectedOption.name} на ${selectedOption.slot}`,
      "ai",
      "bottom",
    );

    // После подтверждения сохраняем подобранные варианты в чате
    setStep("confirmed");
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

  if (!isChatOpen) return null;

  return (
    <div className="chat-modal-backdrop" role="presentation" onClick={closeModal}>
      <section className="booking-modal" onClick={(event) => event.stopPropagation()}>
        <div className="booking-chat-thread">
          {topMessages.map((message) => (
            <div
              key={message.id}
              className={`booking-intro glass-surface ${message.role === "user" ? "booking-intro--user" : "booking-intro--ai"}`}
            >
              <p>{message.text}</p>
            </div>
          ))
          }
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
              placeholder="Хочу маникюр завтра после 18:00"
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
      </section>
    </div>
  );
}
