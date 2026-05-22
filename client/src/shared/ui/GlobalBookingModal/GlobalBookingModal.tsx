"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { confirmAIBooking, searchAIBookingOptions } from "@/shared/api/aiApi";
import { createBooking, getBookingsByMaster } from "@/shared/api/bookingApi";
import { getServicesByMaster } from "@/shared/api/serviziApi";
import { getShadulesByMaster } from "@/shared/api/shaduleApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import { BOOKING_MODAL_EVENT, dispatchBookingModalClose } from "@/shared/lib/bookingEvents";
import { openBookingChat } from "@/shared/lib/openBookingChat";
import { getMasterAvatarUrl } from "@/shared/lib/media";
import { getLocalizedTitle } from "@/shared/lib/localized";
import { BookingModalPayload, BookingType, ServiziType, ShaduleType } from "@/shared/types";
import { quickPrompts, type MasterItem } from "./booking.data";
import type { AIBookingOption } from "@/shared/api/aiApi";

type BookingFlowStep = "idle" | "searching" | "options" | "confirmed";
type DirectBookingStep = "service" | "calendar";
type ChatMessage = {
  id: number;
  text: string;
  role: "ai" | "user";
  placement: "top" | "bottom";
};
type DirectBookingFormState = {
  comment: string;
};
type AISearchSuggestion = {
  id: string;
  title: string;
  prompt: string;
  meta: string;
};

const initialDirectBookingForm: DirectBookingFormState = { comment: "" };

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const emptyDays = Array.from({ length: startOffset }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    return new Date(year, month, index + 1);
  });

  return [...emptyDays, ...days];
}

function getMinutesFromDate(value: string) {
  const date = new Date(value);

  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(totalMinutes: number) {
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  const minutes = `${totalMinutes % 60}`.padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getDateTime(dateKey: string, time: string, duration: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const startTime = new Date(`${dateKey}T00:00:00`);
  startTime.setHours(hours, minutes, 0, 0);

  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);

  return {
    startTime,
    endTime,
  };
}

function isBookingCanceled(booking: BookingType) {
  return booking.status.toLowerCase().includes("отмен");
}

function buildSlotsByDate(
  service: ServiziType | null,
  shadules: ShaduleType[],
  bookings: BookingType[],
) {
  if (!service || shadules.length === 0) {
    return {};
  }

  const slotsByDate: Record<string, string[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayIndex = 0; dayIndex < 21; dayIndex += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayIndex);

    const dayShadules = shadules.filter(
      (item) => item.dayOdWeek === date.getDay() && item.isWorkingDay,
    );

    if (dayShadules.length === 0) {
      continue;
    }

    const dateKey = toDateKey(date);
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const duration = service.duration;
    const dayBookings = bookings.filter((booking) => {
      const bookingDateKey = toDateKey(new Date(booking.startTime));

      return bookingDateKey === dateKey && !isBookingCanceled(booking);
    });

    dayShadules.forEach((shadule) => {
      const slotStart = getMinutesFromDate(shadule.startTime);
      const slotEnd = slotStart + duration;
      const isPastTodaySlot = dayIndex === 0 && slotStart <= currentMinutes;
      const hasConflict = dayBookings.some((booking) => {
        const bookedStart = getMinutesFromDate(booking.startTime);
        const bookedEnd = getMinutesFromDate(booking.endTime);

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (!isPastTodaySlot && !hasConflict) {
        slotsByDate[dateKey] = [...(slotsByDate[dateKey] ?? []), formatTime(slotStart)];
      }
    });
  }

  return slotsByDate;
}

function getCategoryServices(services: ServiziType[], categoryId?: number) {
  return services.filter(
    (service) => service.isActive && (!categoryId || service.categoryId === categoryId),
  );
}

function buildSearchSuggestions(options: AIBookingOption[]) {
  const uniqueByTitle = new Map<
    string,
    AISearchSuggestion & { masterId: number; order: number }
  >();

  options.forEach((option, index) => {
    const title = option.serviceTitle?.trim() || option.service?.trim();
    if (!title) return;

    const key = title.toLowerCase();
    if (uniqueByTitle.has(key)) return;

    uniqueByTitle.set(key, {
      id: `${option.masterId}-${option.serviziId}-${index}`,
      title,
      prompt: title,
      meta: `${option.price} · ${option.slot}`,
      masterId: option.masterId,
      order: index,
    });
  });

  const uniqueSuggestions = Array.from(uniqueByTitle.values()).sort(
    (a, b) => a.order - b.order,
  );
  const seenMasters = new Set<number>();
  const diverseSuggestions: Array<AISearchSuggestion & { masterId: number }> = [];

  uniqueSuggestions.forEach((suggestion) => {
    if (diverseSuggestions.length >= 4) return;
    if (seenMasters.has(suggestion.masterId)) return;
    seenMasters.add(suggestion.masterId);
    diverseSuggestions.push(suggestion);
  });

  if (diverseSuggestions.length < 4) {
    uniqueSuggestions.forEach((suggestion) => {
      if (diverseSuggestions.length >= 4) return;
      if (diverseSuggestions.some((item) => item.id === suggestion.id)) return;
      diverseSuggestions.push(suggestion);
    });
  }

  return diverseSuggestions.map(({ id, title, prompt, meta }) => ({
    id,
    title,
    prompt,
    meta,
  }));
}

export default function GlobalBookingModal() {
  const t = useTranslations("bookingModal");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isInitialized } = useAppSelector((state) => state.user);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState(() => t("defaultDraft"));
  const [suggestions, setSuggestions] = useState<AISearchSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [presetBooking, setPresetBooking] = useState<BookingModalPayload | null>(null);
  const [step, setStep] = useState<BookingFlowStep>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<MasterItem[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, text: t("defaultAiMessage"), role: "ai", placement: "top" },
  ]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedOption, setConfirmedOption] = useState<MasterItem | null>(null);
  const [directBookingForm, setDirectBookingForm] = useState(initialDirectBookingForm);
  const [isDirectBookingLoading, setIsDirectBookingLoading] = useState(false);
  const [isDirectDataLoading, setIsDirectDataLoading] = useState(false);
  const [directBookingError, setDirectBookingError] = useState<string | null>(null);
  const [directBookingSuccess, setDirectBookingSuccess] = useState<string | null>(null);
  const [directCreatedBooking, setDirectCreatedBooking] = useState<BookingType | null>(null);
  const [isOpeningDirectChat, setIsOpeningDirectChat] = useState(false);
  const [directBookingStep, setDirectBookingStep] = useState<DirectBookingStep>("service");
  const [directServices, setDirectServices] = useState<ServiziType[]>([]);
  const [directShadules, setDirectShadules] = useState<ShaduleType[]>([]);
  const [directBookings, setDirectBookings] = useState<BookingType[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState("");

  // Ref нужен, чтобы возвращать фокус в поле ввода после выбора подсказки
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextMessageIdRef = useRef(2);
  const suggestionRequestIdRef = useRef(0);

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
    setIsSuggestionsLoading(false);
    setError(null);
    setOptions([]);
    setSuggestions([]);
    setSelectedOptionId(null);
    setDraft(t("defaultDraft"));
    setChatMessages([{ id: 1, text: t("defaultAiMessage"), role: "ai", placement: "top" }]);
    setBookingConfirmed(false);
    setConfirmedOption(null);
    setPresetBooking(null);
    setDirectBookingForm(initialDirectBookingForm);
    setIsDirectBookingLoading(false);
    setIsDirectDataLoading(false);
    setDirectBookingError(null);
    setDirectBookingSuccess(null);
    setDirectCreatedBooking(null);
    setIsOpeningDirectChat(false);
    setDirectBookingStep("service");
    setDirectServices([]);
    setDirectShadules([]);
    setDirectBookings([]);
    setSelectedServiceId(null);
    setSelectedDate(new Date());
    setSelectedSlot("");
    suggestionRequestIdRef.current += 1;
    nextMessageIdRef.current = 2;
  }, [t]);

  const closeModal = useCallback(() => {
    setIsChatOpen(false);
    resetModalState();
    dispatchBookingModalClose();
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
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (prompt: string) => {
    if (bookingConfirmed) return;

    setDraft(prompt);
    setSuggestions([]);
    setError(null);
    inputRef.current?.focus();
  };

  const handleSubmitDraft = async () => {
    if (bookingConfirmed) return;

    const prompt = draft.trim();

    if (!prompt) {
      setError(t("enterPrompt"));
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setStep("searching");
    setOptions([]);
    setSelectedOptionId(null);
    pushChatMessage(prompt, "user");
    pushChatMessage(t("searching"), "ai");

    try {
      const found = await searchAIBookingOptions(prompt, 6);

      if (found.length === 0) {
        pushChatMessage(
          "Пока не нашлось свободных слотов по такому запросу. Попробуйте изменить время или услугу.",
          "ai",
        );
        setStep("idle");
        return;
      }

      setOptions(found);
      setStep("options");
      pushChatMessage(
        `По запросу «${prompt}» найдено ${found.length} вариантов, выберите подходящий`,
        "ai",
      );
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Не удалось подобрать варианты, попробуйте еще раз",
      );
      setStep("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedOption || step !== "options" || bookingConfirmed) return;

    try {
      setIsLoading(true);
      setError(null);

      await confirmAIBooking({
        masterId: selectedOption.masterId,
        serviziId: selectedOption.serviziId,
        date: selectedOption.date,
        startTime: selectedOption.startTime,
        endTime: selectedOption.endTime,
      });

      setBookingConfirmed(true);
      setConfirmedOption(selectedOption);
      pushChatMessage(
        `Запись подтверждена к мастеру ${selectedOption.name} на ${selectedOption.slot}`,
        "ai",
        "bottom",
      );
      setStep("confirmed");
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Не удалось создать запись",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectBookingCommentChange = (value: string) => {
    // Остальные поля записи собираются из выбранной услуги, дня и слота.
    setDirectBookingForm({ comment: value });
  };

  useEffect(() => {
    if (!isChatOpen || !presetBooking || !user) return;

    const loadDirectBookingData = async () => {
      try {
        setIsDirectDataLoading(true);
        setDirectBookingError(null);
        setDirectBookingSuccess(null);

        const [servicesResult, shadulesResult, bookingsResult] = await Promise.allSettled([
          getServicesByMaster(presetBooking.masterId),
          getShadulesByMaster(presetBooking.masterId),
          getBookingsByMaster(presetBooking.masterId),
        ]);

        const loadedServicesFromApi =
          servicesResult.status === "fulfilled" && servicesResult.value.length > 0
            ? servicesResult.value
            : presetBooking.services ?? [];
        const categoryServices = getCategoryServices(
          loadedServicesFromApi,
          presetBooking.categoryId,
        );
        const fallbackCategoryServices = getCategoryServices(
          presetBooking.services ?? [],
          presetBooking.categoryId,
        );
        const loadedShadules = shadulesResult.status === "fulfilled" ? shadulesResult.value : [];
        const loadedBookings = bookingsResult.status === "fulfilled" ? bookingsResult.value : [];

        setDirectServices(
          categoryServices.length > 0 ? categoryServices : fallbackCategoryServices,
        );
        setDirectShadules(loadedShadules);
        setDirectBookings(loadedBookings);

        if (servicesResult.status === "rejected") {
          setDirectBookingError(servicesResult.reason.message);
        }
      } finally {
        setIsDirectDataLoading(false);
      }
    };

    void loadDirectBookingData();
  }, [isChatOpen, presetBooking, user]);

  const selectedDirectService = useMemo(
    () => directServices.find((service) => service.id === selectedServiceId) ?? null,
    [directServices, selectedServiceId],
  );

  const directSlotsByDate = useMemo(
    () => buildSlotsByDate(selectedDirectService, directShadules, directBookings),
    [directBookings, directShadules, selectedDirectService],
  );

  const directMonthDays = useMemo(
    () => getMonthDays(selectedDate.getFullYear(), selectedDate.getMonth()),
    [selectedDate],
  );
  const selectedDateKey = toDateKey(selectedDate);
  const selectedDateSlots = directSlotsByDate[selectedDateKey] ?? [];
  const activeSlot = selectedDateSlots.includes(selectedSlot)
    ? selectedSlot
    : selectedDateSlots[0] ?? "";
  const monthTitle = selectedDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const handleDirectServiceSelect = (serviceId: number) => {
    if (directBookingSuccess) return;

    setSelectedServiceId(serviceId);
    setSelectedSlot("");
    setSelectedDate(new Date());
    setDirectBookingStep("calendar");
    setDirectBookingError(null);
    setDirectBookingSuccess(null);
  };

  const handleDirectMonthChange = (direction: number) => {
    if (directBookingSuccess) return;

    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1),
    );
    setSelectedSlot("");
  };

  const handleDirectBookingSubmit = async () => {
    if (
      !presetBooking ||
      !user ||
      !selectedDirectService ||
      !activeSlot ||
      directBookingSuccess
    ) {
      return;
    }

    const { startTime, endTime } = getDateTime(
      selectedDateKey,
      activeSlot,
      selectedDirectService.duration,
    );

    try {
      setIsDirectBookingLoading(true);
      setDirectBookingError(null);
      setDirectBookingSuccess(null);

      const createdBooking = await createBooking({
        clientId: user.id,
        masterId: presetBooking.masterId,
        serviziId: selectedDirectService.id,
        date: new Date(`${selectedDateKey}T00:00:00`).toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: "Ожидает подтверждения",
        clientComment: directBookingForm.comment.trim() || undefined,
      });

      setDirectCreatedBooking(createdBooking);
      setDirectBookingSuccess(t("directSuccess"));
      setDirectBookings((currentBookings) => [
        ...currentBookings,
        {
          id: Date.now(),
          clientId: user.id,
          masterId: presetBooking.masterId,
          serviziId: selectedDirectService.id,
          date: new Date(`${selectedDateKey}T00:00:00`).toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: "Ожидает подтверждения",
          clientComment: directBookingForm.comment.trim(),
        },
      ]);
      setSelectedSlot("");
      setDirectBookingForm(initialDirectBookingForm);
    } catch (submitError) {
      setDirectBookingError(
        submitError instanceof Error
          ? submitError.message
          : t("directError"),
      );
    } finally {
      setIsDirectBookingLoading(false);
    }
  };

  const handleOpenDirectChat = async () => {
    if (!directCreatedBooking) return;

    try {
      setIsOpeningDirectChat(true);
      setDirectBookingError(null);
      await openBookingChat(router, directCreatedBooking);
      closeModal();
    } catch (error) {
      setDirectBookingError(error instanceof Error ? error.message : t("chatError"));
    } finally {
      setIsOpeningDirectChat(false);
    }
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSubmitDraft();
    }
  };

  useEffect(() => {
    if (!isChatOpen || presetBooking || bookingConfirmed) return;

    const query = draft.trim();
    if (query.length < 3) return;

    const debounceTimer = window.setTimeout(() => {
      const currentRequestId = suggestionRequestIdRef.current + 1;
      suggestionRequestIdRef.current = currentRequestId;
      setIsSuggestionsLoading(true);

      const runSuggestionsSearch = async () => {
        try {
          const found = await searchAIBookingOptions(query, 4, { useAI: false });
          if (suggestionRequestIdRef.current !== currentRequestId) return;
          setSuggestions(buildSearchSuggestions(found));
        } catch {
          if (suggestionRequestIdRef.current !== currentRequestId) return;
          setSuggestions([]);
        } finally {
          if (suggestionRequestIdRef.current === currentRequestId) {
            setIsSuggestionsLoading(false);
          }
        }
      };

      void runSuggestionsSearch();
    }, 350);

    return () => {
      window.clearTimeout(debounceTimer);
    };
  }, [bookingConfirmed, draft, isChatOpen, presetBooking]);

  const shouldShowOptions = step === "options" || step === "confirmed";
  const shouldShowReview = step === "options" && !!selectedOption;
  const shouldShowConfirmedCard = step === "confirmed" && !!confirmedOption;
  const topMessages = chatMessages.filter((message) => message.placement === "top");
  const bottomMessages = chatMessages.filter((message) => message.placement === "bottom");
  const isPresetMode = !!presetBooking;
  const weekDays = t.raw("weekDays") as string[];
  // В прямой записи показываем тот же локальный аватар мастера, что и в остальных карточках
  const presetMasterAvatarUrl = presetBooking ? getMasterAvatarUrl(presetBooking.masterId) : "";

  if (!isChatOpen) return null;

  return (
    <div className="chat-modal-backdrop" role="presentation" onClick={closeModal}>
      <section className="booking-modal" onClick={(event) => event.stopPropagation()}>
        {isPresetMode ? (
          <div className="booking-direct-mode">
            <div className="booking-intro glass-surface">
              <p>{t("directIntro")}</p>
            </div>

            {/* Этот сценарий открывается из карточек услуг, а не из AI поиска */}
            <article className="booking-direct-card glass-surface">
              <div className="booking-direct-card-head">
                {presetMasterAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="master-avatar master-avatar-image" src={presetMasterAvatarUrl} alt="" />
                ) : (
                  <span className="master-avatar">{presetBooking.masterId}</span>
                )}
                <div className="master-head">
                  <strong>{presetBooking.masterName ?? t("masterNumber", { id: presetBooking.masterId })}</strong>
                  <span>
                    {locale === "en" && presetBooking.categoryTitleEn
                      ? presetBooking.categoryTitleEn
                      : presetBooking.categoryTitle}
                  </span>
                </div>
              </div>

              <p className="booking-direct-description">
                {t("directHint")}
              </p>
            </article>

            <div className="booking-direct-form glass-surface">
              {isDirectDataLoading ? <p className="booking-direct-description">{t("loadingDirect")}</p> : null}

              {directBookingError ? (
                <p className="booking-direct-feedback booking-direct-feedback--error">
                  {directBookingError}
                </p>
              ) : null}

              {directBookingSuccess ? (
                <div className="booking-direct-success-actions">
                  <p className="booking-direct-feedback booking-direct-feedback--success">
                    {directBookingSuccess}
                  </p>
                  <button
                    className="booking-confirm-button"
                    type="button"
                    disabled={!directCreatedBooking || isOpeningDirectChat}
                    onClick={() => void handleOpenDirectChat()}
                  >
                    {isOpeningDirectChat ? t("openingChat") : t("writeMaster")}
                  </button>
                  <button
                    className="booking-confirm-button"
                    type="button"
                    onClick={closeModal}
                  >
                    Закрыть
                  </button>
                </div>
              ) : null}

              {!isDirectDataLoading && directServices.length === 0 ? (
                <p className="booking-direct-feedback booking-direct-feedback--error">
                  {t("noServices")}
                </p>
              ) : null}

              {directServices.length > 0 ? (
                <div className="booking-direct-services">
                  {directServices.map((service) => (
                    <button
                      className={`booking-direct-service-card ${
                        selectedServiceId === service.id ? "booking-direct-service-card-active" : ""
                      }`}
                      key={service.id}
                      type="button"
                      disabled={!!directBookingSuccess}
                      onClick={() => handleDirectServiceSelect(service.id)}
                    >
                      <strong>{getLocalizedTitle(service, locale) ?? service.title}</strong>
                      <span>
                        {service.duration} {commonT("minutes")} · {service.price.toLocaleString(locale)} ₽
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {directBookingStep === "calendar" && selectedDirectService ? (
                <div className="booking-direct-calendar">
                  <div className="booking-direct-calendar-toolbar">
                    <button
                      type="button"
                      onClick={() => handleDirectMonthChange(-1)}
                      aria-label={t("prevMonth")}
                    >
                      ‹
                    </button>
                    <h3>{monthTitle}</h3>
                    <button
                      type="button"
                      onClick={() => handleDirectMonthChange(1)}
                      aria-label={t("nextMonth")}
                    >
                      ›
                    </button>
                  </div>

                  <div className="booking-direct-weekdays">
                    {weekDays.map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="booking-direct-calendar-grid">
                    {directMonthDays.map((date, index) => {
                      if (!date) {
                        return <div className="booking-direct-day-empty" key={index} />;
                      }

                      const dateKey = toDateKey(date);
                      const slotsCount = directSlotsByDate[dateKey]?.length ?? 0;
                      const isSelected = dateKey === selectedDateKey;

                      return (
                        <button
                          className={`booking-direct-day ${
                            isSelected ? "booking-direct-day-active" : ""
                          }`}
                          key={dateKey}
                          type="button"
                          disabled={!!directBookingSuccess}
                          onClick={() => {
                            if (directBookingSuccess) return;
                            setSelectedDate(date);
                            setSelectedSlot("");
                          }}
                        >
                          <span>{date.getDate()}</span>
                          {slotsCount > 0 ? <small>{t("slotsCount", { count: slotsCount })}</small> : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="booking-direct-slots">
                    <h3>
                      {selectedDate.toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                      })}
                    </h3>
                    <div className="booking-direct-slot-list">
                      {selectedDateSlots.length > 0 ? (
                        selectedDateSlots.map((slot) => (
                          <button
                            className={slot === activeSlot ? "booking-direct-slot-active" : ""}
                            key={slot}
                            type="button"
                            disabled={!!directBookingSuccess}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {slot}
                          </button>
                        ))
                      ) : (
                        <p>{t("noSlots")}</p>
                      )}
                    </div>
                  </div>

                  <label className="booking-direct-field">
                    <span>{t("comment")}</span>
                    <textarea
                      className="booking-direct-textarea"
                      value={directBookingForm.comment}
                      onChange={(event) => handleDirectBookingCommentChange(event.target.value)}
                      placeholder={t("commentPlaceholder")}
                      rows={4}
                      disabled={!!directBookingSuccess}
                    />
                  </label>
                </div>
              ) : null}

              <button
                className="booking-confirm-button"
                type="button"
                disabled={
                  isDirectBookingLoading ||
                  !selectedDirectService ||
                  !activeSlot ||
                  !!directBookingSuccess
                }
                onClick={() => void handleDirectBookingSubmit()}
              >
                {isDirectBookingLoading ? t("sending") : t("sendBooking")}
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
                <p className="booking-confirm-title">{t("checkOption")}</p>

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
                  disabled={isLoading}
                  onClick={() => void handleConfirmBooking()}
                >
                  {isLoading ? "Подтверждаю" : "Подтвердить запись"}
                </button>
              </div>
            ) : null}

            {shouldShowConfirmedCard ? (
              <div className="booking-confirm">
                <p className="booking-confirm-title">{t("confirmedTitle")}</p>

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
                  <strong>{t("aiTitle")}</strong>
                  <span>{t("aiSubtitle")}</span>
                </div>
              </div>

              <div className="booking-ai-input-row">
                <input
                  ref={inputRef}
                  className="booking-ai-input"
                  value={draft}
                  onChange={(event) => {
                    if (bookingConfirmed) return;
                    const nextDraft = event.target.value;
                    setDraft(nextDraft);

                    if (nextDraft.trim().length < 3) {
                      setSuggestions([]);
                      setIsSuggestionsLoading(false);
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder={t("defaultDraft")}
                  disabled={bookingConfirmed}
                />
                <button
                  className="booking-ai-button"
                  type="button"
                  onClick={() => void handleSubmitDraft()}
                  disabled={isLoading || bookingConfirmed}
                >
                  {isLoading ? t("searchingButton") : t("searchButton")}
                </button>
              </div>

              {error ? <p className="master-meta">{error}</p> : null}

              {!bookingConfirmed && draft.trim().length >= 3 ? (
                <div className="booking-ai-suggestions">
                  <div className="booking-ai-suggestions-head">
                    <strong>{t("suggestionsTitle")}</strong>
                    {isSuggestionsLoading ? <span>{t("suggestionsLoading")}</span> : null}
                  </div>

                  {suggestions.length > 0 ? (
                    <div className="booking-ai-suggestions-list">
                      {suggestions.map((suggestion) => (
                        <button
                          className="booking-ai-suggestion"
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion.prompt)}
                          disabled={isSuggestionsLoading}
                        >
                          <strong>{suggestion.title}</strong>
                          <span>{suggestion.meta}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

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
