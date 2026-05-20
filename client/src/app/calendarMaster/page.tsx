"use client";

import "./page.css";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { createBooking, getBookingsByMaster, updateBooking } from "@/shared/api/bookingApi";
import { getServicesByMaster } from "@/shared/api/serviziApi";
import {
  createShadule,
  deleteShadule,
  getShadulesByMaster,
} from "@/shared/api/shaduleApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import { getAccessToken } from "@/shared/lib/axiosInstance";
import { openBookingChat } from "@/shared/lib/openBookingChat";
import type { BookingType, ServiziType, ShaduleType } from "@/shared/types";

type AppointmentStatus = "confirmed" | "pending" | "done" | "canceled";

type Appointment = {
  id: number;
  booking: BookingType;
  clientName: string;
  clientComment?: string;
  service: string;
  time: string;
  duration: string;
  price: string;
  status: AppointmentStatus;
};

type ScheduleDraft = {
  dayOdWeek: number;
  label: string;
  isWorkingDay: boolean;
  slots: Array<{
    id?: number;
    time: string;
  }>;
  newSlotTime: string;
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const scheduleDays = [
  { dayOdWeek: 1, label: "Понедельник" },
  { dayOdWeek: 2, label: "Вторник" },
  { dayOdWeek: 3, label: "Среда" },
  { dayOdWeek: 4, label: "Четверг" },
  { dayOdWeek: 5, label: "Пятница" },
  { dayOdWeek: 6, label: "Суббота" },
  { dayOdWeek: 0, label: "Воскресенье" },
];
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const statusText: Record<AppointmentStatus, string> = {
  confirmed: "Подтверждена",
  pending: "Ждет ответа",
  done: "Завершена",
  canceled: "Отменена",
};

const nextStatus: Record<AppointmentStatus, AppointmentStatus> = {
  pending: "confirmed",
  confirmed: "done",
  done: "pending",
  canceled: "pending",
};

const nextStatusButtonText: Record<AppointmentStatus, string> = {
  pending: "Подтвердить",
  confirmed: "Завершить",
  done: "Вернуть в ожидание",
  canceled: "Вернуть в ожидание",
};

const backendStatusByUiStatus: Record<AppointmentStatus, string> = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  done: "Завершена",
  canceled: "Отменено",
};

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

function getTimeValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "09:00";
  }

  return `${date.getHours()}`.padStart(2, "0") + `:${date.getMinutes()}`.padStart(2, "0");
}

function getMinutesFromDate(value: string) {
  const date = new Date(value);

  return date.getHours() * 60 + date.getMinutes();
}

function formatMinutes(totalMinutes: number) {
  const hours = `${Math.floor(totalMinutes / 60)}`.padStart(2, "0");
  const minutes = `${totalMinutes % 60}`.padStart(2, "0");

  return `${hours}:${minutes}`;
}

function getScheduleDate(dayOdWeek: number, time: string) {
  const monday = new Date(2024, 6, 1);
  const date = new Date(monday);
  const dayOffset = dayOdWeek === 0 ? 6 : dayOdWeek - 1;
  const [hours, minutes] = time.split(":").map(Number);

  date.setDate(monday.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);

  return date.toISOString();
}

function getScheduleEndDate(dayOdWeek: number, time: string) {
  const date = new Date(getScheduleDate(dayOdWeek, time));
  date.setMinutes(date.getMinutes() + 30);

  return date.toISOString();
}

function getScheduleSlotKey(dayOdWeek: number, time: string) {
  return `${dayOdWeek}-${time}`;
}

function getBookingDateTimes(dateKey: string, time: string, duration: number) {
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

function getInitialScheduleDrafts(shadules: ShaduleType[] = []): ScheduleDraft[] {
  return scheduleDays.map((day) => {
    const dayShadules = shadules
      .filter((item) => item.dayOdWeek === day.dayOdWeek && item.isWorkingDay)
      .map((item) => ({
        id: item.id,
        time: getTimeValue(item.startTime),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      dayOdWeek: day.dayOdWeek,
      label: day.label,
      isWorkingDay: dayShadules.length > 0,
      slots: dayShadules,
      newSlotTime: dayShadules.at(-1)?.time ?? "09:00",
    };
  });
}

function getAppointmentStatus(status: string): AppointmentStatus {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("отмен") || normalizedStatus.includes("cancel")) {
    return "canceled";
  }
  if (normalizedStatus.includes("заверш") || normalizedStatus.includes("done")) return "done";
  if (normalizedStatus.includes("подтверж") || normalizedStatus.includes("confirm")) {
    return "confirmed";
  }

  return "pending";
}

function getDurationLabel(booking: BookingType, service?: ServiziType) {
  if (service?.duration) {
    return `${service.duration} мин`;
  }

  const diffMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  return diffMinutes > 0 ? `${diffMinutes} мин` : "—";
}

function getPriceLabel(service?: ServiziType) {
  return service ? `${service.price.toLocaleString("ru-RU")} ₽` : "—";
}

function isBookingCanceled(booking: BookingType) {
  return getAppointmentStatus(booking.status) === "canceled";
}

function buildAppointmentsByDate(bookings: BookingType[], services: ServiziType[]) {
  const servicesById = new Map(services.map((service) => [service.id, service]));

  return bookings.reduce<Record<string, Appointment[]>>((result, booking) => {
    if (isBookingCanceled(booking)) {
      return result;
    }

    const service = servicesById.get(booking.serviziId);
    const startDate = new Date(booking.startTime);
    const dateKey = toDateKey(startDate);
    const appointment: Appointment = {
      id: booking.id,
      booking,
      clientName: `Клиент #${booking.clientId}`,
      clientComment: booking.clientComment,
      service: service?.title ?? `Услуга #${booking.serviziId}`,
      time: startDate.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: getDurationLabel(booking, service),
      price: getPriceLabel(service),
      status: getAppointmentStatus(booking.status),
    };

    return {
      ...result,
      [dateKey]: [...(result[dateKey] ?? []), appointment].sort((a, b) =>
        a.time.localeCompare(b.time),
      ),
    };
  }, {});
}

function buildFreeSlotsByDate(
  monthDays: Array<Date | null>,
  scheduleDrafts: ScheduleDraft[],
  bookings: BookingType[],
) {
  return monthDays.reduce<Record<string, string[]>>((result, date) => {
    if (!date) return result;

    const schedule = scheduleDrafts.find(
      (draft) => draft.dayOdWeek === date.getDay() && draft.isWorkingDay,
    );

    if (!schedule) return result;

    const dateKey = toDateKey(date);
    const dayBookings = bookings.filter((booking) => {
      const bookingDateKey = toDateKey(new Date(booking.startTime));

      return bookingDateKey === dateKey && !isBookingCanceled(booking);
    });
    const slots: string[] = [];

    schedule.slots.forEach((scheduleSlot) => {
      const slotStart = getMinutesFromDate(getScheduleDate(schedule.dayOdWeek, scheduleSlot.time));
      const slotEnd = slotStart + 30;
      const hasConflict = dayBookings.some((booking) => {
        const bookedStart = getMinutesFromDate(booking.startTime);
        const bookedEnd = getMinutesFromDate(booking.endTime);

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (!hasConflict) {
        slots.push(formatMinutes(slotStart));
      }
    });

    return slots.length > 0 ? { ...result, [dateKey]: slots } : result;
  }, {});
}

function buildSlotsForDate(
  date: Date,
  scheduleDrafts: ScheduleDraft[],
  bookings: BookingType[],
  duration: number,
) {
  const schedule = scheduleDrafts.find(
    (draft) => draft.dayOdWeek === date.getDay() && draft.isWorkingDay,
  );

  if (!schedule || !duration || schedule.slots.length === 0) return [];

  const dateKey = toDateKey(date);
  const dayBookings = bookings.filter((booking) => {
    const bookingDateKey = toDateKey(new Date(booking.startTime));

    return bookingDateKey === dateKey && !isBookingCanceled(booking);
  });
  const slots: string[] = [];

  schedule.slots.forEach((scheduleSlot) => {
    const slotStart = getMinutesFromDate(getScheduleDate(schedule.dayOdWeek, scheduleSlot.time));
    const slotEnd = slotStart + duration;
    const hasConflict = dayBookings.some((booking) => {
      const bookedStart = getMinutesFromDate(booking.startTime);
      const bookedEnd = getMinutesFromDate(booking.endTime);

      return slotStart < bookedEnd && slotEnd > bookedStart;
    });

    if (!hasConflict) {
      slots.push(formatMinutes(slotStart));
    }
  });

  return slots;
}

export default function CalendarMasterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isInitialized } = useAppSelector((state) => state.user);
  const masterId = user?.role === "master" ? user.id : undefined;
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [scheduleDrafts, setScheduleDrafts] = useState<ScheduleDraft[]>(
    getInitialScheduleDrafts(),
  );
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isStatusSaving, setIsStatusSaving] = useState<number | null>(null);
  const [openingChatBookingId, setOpeningChatBookingId] = useState<number | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isManualBookingSaving, setIsManualBookingSaving] = useState(false);
  const [manualBookingError, setManualBookingError] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    clientId: "",
    serviceId: "",
    time: "",
    status: "Ожидает подтверждения",
    clientComment: "",
  });

  const selectedKey = toDateKey(selectedDate);
  const monthDays = useMemo(
    () => getMonthDays(selectedDate.getFullYear(), selectedDate.getMonth()),
    [selectedDate],
  );
  const monthTitle = selectedDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
  const appointmentsByDate = useMemo(
    () => buildAppointmentsByDate(bookings, services),
    [bookings, services],
  );
  const freeSlotsByDate = useMemo(
    () => buildFreeSlotsByDate(monthDays, scheduleDrafts, bookings),
    [bookings, monthDays, scheduleDrafts],
  );
  const selectedAppointments = appointmentsByDate[selectedKey] ?? [];
  const selectedFreeSlots = freeSlotsByDate[selectedKey] ?? [];
  const selectedManualService =
    services.find((service) => service.id === Number(manualForm.serviceId)) ?? services[0];
  const manualBookingSlots = useMemo(
    () =>
      selectedManualService
        ? buildSlotsForDate(
            selectedDate,
            scheduleDrafts,
            bookings,
            selectedManualService.duration,
          )
        : [],
    [bookings, scheduleDrafts, selectedDate, selectedManualService],
  );
  const selectedManualTime = manualBookingSlots.includes(manualForm.time)
    ? manualForm.time
    : manualBookingSlots[0] ?? "";
  const scheduleAccessError =
    isInitialized && !masterId
      ? "Войдите как мастер, чтобы загрузить календарь и сохранить расписание."
      : null;

  useEffect(() => {
    if (!isInitialized) {
      void dispatch(refreshTokenThunk());
    }
  }, [dispatch, isInitialized]);

  async function loadMasterCalendarData(currentMasterId: number) {
    try {
      setIsPageLoading(true);
      setPageError(null);
      setScheduleError(null);

      const [servicesResult, bookingsResult, shadulesResult] = await Promise.allSettled([
        getServicesByMaster(currentMasterId),
        getBookingsByMaster(currentMasterId),
        getShadulesByMaster(currentMasterId),
      ]);

      if (servicesResult.status === "fulfilled") {
        setServices(servicesResult.value);
      } else {
        setServices([]);
        setPageError(servicesResult.reason.message);
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value);
      } else {
        setBookings([]);
        setPageError(bookingsResult.reason.message);
      }

      if (shadulesResult.status === "fulfilled") {
        setScheduleDrafts(getInitialScheduleDrafts(shadulesResult.value));
      } else {
        setScheduleDrafts(getInitialScheduleDrafts());
        setScheduleError("Расписание пока не найдено, можно сохранить новое.");
      }
    } finally {
      setIsPageLoading(false);
    }
  }

  useEffect(() => {
    if (!isInitialized || !masterId) return;

    void loadMasterCalendarData(masterId);
  }, [isInitialized, masterId]);

  useEffect(() => {
    if (!isInitialized || !masterId) return;

    const socket = io(API_ORIGIN, {
      auth: { token: getAccessToken() },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("booking:updated", (updatedBooking: BookingType) => {
      if (updatedBooking.masterId !== masterId) return;

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === updatedBooking.id ? updatedBooking : booking,
        ),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [isInitialized, masterId]);

  function changeMonth(direction: number) {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1),
    );
  }

  async function handleChangeAppointmentStatus(appointment: Appointment) {
    const nextUiStatus = nextStatus[appointment.status];

    try {
      setIsStatusSaving(appointment.id);
      const updatedBooking = await updateBooking(appointment.id, {
        status: backendStatusByUiStatus[nextUiStatus],
      });
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === appointment.id ? { ...booking, ...updatedBooking } : booking,
        ),
      );
    } finally {
      setIsStatusSaving(null);
    }
  }

  async function handleOpenAppointmentChat(booking: BookingType) {
    try {
      setOpeningChatBookingId(booking.id);
      setPageError(null);
      await openBookingChat(router, booking);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Не удалось открыть чат.");
    } finally {
      setOpeningChatBookingId(null);
    }
  }

  async function handleCreateManualBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!masterId || !selectedManualService || !selectedManualTime) {
      setManualBookingError("Выберите услугу и свободное время.");
      return;
    }

    const clientId = Number(manualForm.clientId);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      setManualBookingError("Укажите корректный ID клиента.");
      return;
    }

    const { startTime, endTime } = getBookingDateTimes(
      selectedKey,
      selectedManualTime,
      selectedManualService.duration,
    );

    try {
      setIsManualBookingSaving(true);
      setManualBookingError(null);
      const createdBooking = await createBooking({
        clientId,
        masterId,
        serviziId: selectedManualService.id,
        date: new Date(`${selectedKey}T00:00:00`).toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: manualForm.status,
        clientComment: manualForm.clientComment.trim() || undefined,
      });

      setBookings((currentBookings) => [...currentBookings, createdBooking]);
      setManualForm({
        clientId: "",
        serviceId: `${selectedManualService.id}`,
        time: "",
        status: "Ожидает подтверждения",
        clientComment: "",
      });
      setIsAddFormOpen(false);
    } catch (error) {
      setManualBookingError(
        error instanceof Error ? error.message : "Не удалось создать запись.",
      );
    } finally {
      setIsManualBookingSaving(false);
    }
  }

  function updateScheduleDraft(dayOdWeek: number, patch: Partial<ScheduleDraft>) {
    setScheduleDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.dayOdWeek === dayOdWeek ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function addScheduleSlot(dayOdWeek: number) {
    setScheduleDrafts((currentDrafts) =>
      currentDrafts.map((draft) => {
        if (draft.dayOdWeek !== dayOdWeek) return draft;

        if (!draft.newSlotTime || draft.slots.some((slot) => slot.time === draft.newSlotTime)) {
          return draft;
        }

        return {
          ...draft,
          isWorkingDay: true,
          slots: [...draft.slots, { time: draft.newSlotTime }].sort((a, b) =>
            a.time.localeCompare(b.time),
          ),
        };
      }),
    );
  }

  function removeScheduleSlot(dayOdWeek: number, time: string) {
    setScheduleDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.dayOdWeek === dayOdWeek
          ? {
              ...draft,
              slots: draft.slots.filter((slot) => slot.time !== time),
            }
          : draft,
      ),
    );
  }

  async function handleSaveSchedule() {
    if (!masterId) {
      setScheduleError("Войдите как мастер, чтобы сохранить расписание.");
      return;
    }

    const emptyWorkingDay = scheduleDrafts.find(
      (draft) => draft.isWorkingDay && draft.slots.length === 0,
    );

    if (emptyWorkingDay) {
      setScheduleError(`Добавьте хотя бы один слот на ${emptyWorkingDay.label} или выключите день.`);
      return;
    }

    try {
      setIsScheduleSaving(true);
      setScheduleError(null);
      setScheduleMessage(null);

      const existingShadules = await getShadulesByMaster(masterId).catch(() => []);
      const existingByKey = new Map<string, ShaduleType>();
      const duplicateExistingIds: number[] = [];

      existingShadules.forEach((shadule) => {
        const key = getScheduleSlotKey(shadule.dayOdWeek, getTimeValue(shadule.startTime));

        if (existingByKey.has(key)) {
          duplicateExistingIds.push(shadule.id);
          return;
        }

        existingByKey.set(key, shadule);
      });

      const desiredSlots = scheduleDrafts.flatMap((draft) =>
        draft.isWorkingDay
          ? draft.slots.map((slot) => ({
              dayOdWeek: draft.dayOdWeek,
              label: draft.label,
              time: slot.time,
              key: getScheduleSlotKey(draft.dayOdWeek, slot.time),
            }))
          : [],
      );
      const desiredKeys = new Set(desiredSlots.map((slot) => slot.key));

      for (const slot of desiredSlots) {
        if (existingByKey.has(slot.key)) continue;

        try {
          await createShadule({
            masterId,
            dayOdWeek: slot.dayOdWeek,
            startTime: getScheduleDate(slot.dayOdWeek, slot.time),
            endTime: getScheduleEndDate(slot.dayOdWeek, slot.time),
            isWorkingDay: true,
          });
        } catch (error) {
          throw new Error(
            `Не удалось сохранить ${slot.label}, ${slot.time}: ${
              error instanceof Error ? error.message : "ошибка сервера"
            }`,
          );
        }
      }

      const obsoleteIds = existingShadules
        .filter((shadule) => {
          const key = getScheduleSlotKey(shadule.dayOdWeek, getTimeValue(shadule.startTime));

          return !desiredKeys.has(key);
        })
        .map((shadule) => shadule.id);

      for (const id of [...new Set([...obsoleteIds, ...duplicateExistingIds])]) {
        await deleteShadule(id);
      }

      const reloadedShadules = await getShadulesByMaster(masterId);
      setScheduleDrafts(getInitialScheduleDrafts(reloadedShadules));
      setScheduleMessage("Расписание сохранено.");
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Не удалось сохранить расписание.",
      );
    } finally {
      setIsScheduleSaving(false);
    }
  }

  return (
    <main className="master-calendar-page">
      <section className="master-calendar-hero">
        <div>
          <p className="master-calendar-kicker">Календарь мастера</p>
          <h1>Записи, свободные окна и клиенты на день</h1>
        </div>
        <div className="master-calendar-actions">
          <button
            className="master-calendar-secondary"
            type="button"
            disabled={!masterId}
            onClick={() => {
              setIsAddFormOpen((isOpen) => !isOpen);
              setManualBookingError(null);
              setManualForm((currentForm) => ({
                ...currentForm,
                serviceId: currentForm.serviceId || `${services[0]?.id ?? ""}`,
              }));
            }}
          >
            Добавить запись
          </button>
        </div>
      </section>

      {scheduleAccessError || pageError ? (
        <section className="master-calendar-state">
          <p>{scheduleAccessError ?? pageError}</p>
        </section>
      ) : null}

      <section className="master-schedule-panel">
        <div className="master-schedule-panel__header">
          <div>
            <p className="master-calendar-kicker">Рабочая неделя</p>
            <h2>Расписание мастера</h2>
          </div>
          <button
            className="master-calendar-primary"
            type="button"
            disabled={isScheduleSaving || isPageLoading || !masterId}
            onClick={() => void handleSaveSchedule()}
          >
            {isScheduleSaving ? "Сохранение..." : "Сохранить график"}
          </button>
        </div>

        {scheduleError ? <p className="master-schedule-message">{scheduleError}</p> : null}
        {scheduleMessage ? (
          <p className="master-schedule-message master-schedule-message--success">
            {scheduleMessage}
          </p>
        ) : null}

        <div className="master-schedule-grid">
          {scheduleDrafts.map((draft, index) => (
            <article
              className="master-schedule-day"
              key={`schedule-${draft.dayOdWeek}-${index}`}
            >
              <label className="master-schedule-day__toggle">
                <input
                  type="checkbox"
                  checked={draft.isWorkingDay}
                  onChange={(event) =>
                    updateScheduleDraft(draft.dayOdWeek, {
                      isWorkingDay: event.target.checked,
                    })
                  }
                />
                <span>{draft.label}</span>
              </label>

              <div className="master-schedule-day__time">
                <label>
                  <span>Новый слот</span>
                  <input
                    type="time"
                    value={draft.newSlotTime}
                    disabled={!draft.isWorkingDay}
                    onChange={(event) =>
                      updateScheduleDraft(draft.dayOdWeek, {
                        newSlotTime: event.target.value,
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={!draft.isWorkingDay}
                  onClick={() => addScheduleSlot(draft.dayOdWeek)}
                >
                  Добавить слот
                </button>
                <div className="master-schedule-slots">
                  {draft.slots.length > 0 ? (
                    draft.slots.map((slot) => (
                      <button
                        type="button"
                        key={`${draft.dayOdWeek}-${slot.time}`}
                        disabled={!draft.isWorkingDay}
                        onClick={() => removeScheduleSlot(draft.dayOdWeek, slot.time)}
                        aria-label={`Удалить слот ${slot.time}`}
                      >
                        {slot.time} x
                      </button>
                    ))
                  ) : (
                    <p>Слоты не добавлены</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="master-calendar-layout">
        <div className="master-calendar-panel">
          <div className="master-calendar-toolbar">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц">
              ‹
            </button>
            <h2>{monthTitle}</h2>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Следующий месяц">
              ›
            </button>
          </div>

          <div className="master-calendar-weekdays">
            {weekDays.map((day) => (
              <span key={`weekday-${day}`}>{day}</span>
            ))}
          </div>

          <div className="master-calendar-grid">
            {monthDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    className="master-calendar-day master-calendar-day--empty"
                    key={`empty-${index}`}
                  />
                );
              }

              const dateKey = toDateKey(date);
              const dayAppointments = appointmentsByDate[dateKey]?.length ?? 0;
              const dayFreeSlots = freeSlotsByDate[dateKey]?.length ?? 0;
              const isSelected = dateKey === selectedKey;

              return (
                <button
                  className={`master-calendar-day ${
                    isSelected ? "master-calendar-day--selected" : ""
                  }`}
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="master-calendar-day__number">{date.getDate()}</span>
                  <span className="master-calendar-day__meta">
                    {dayAppointments > 0 ? `${dayAppointments} записи` : "нет записей"}
                  </span>
                  {dayFreeSlots > 0 && (
                    <span className="master-calendar-day__slots">{dayFreeSlots} окон</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="master-day-panel">
          <div className="master-day-panel__header">
            <div>
              <p>Выбранный день</p>
              <h2>
                {selectedDate.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                })}
              </h2>
            </div>
            <span>{selectedAppointments.length} записи</span>
          </div>

          {isAddFormOpen ? (
            <form className="master-add-form" onSubmit={handleCreateManualBooking}>
              <h3>Добавить запись</h3>

              {manualBookingError ? (
                <p className="master-form-error">{manualBookingError}</p>
              ) : null}

              {services.length === 0 ? (
                <p className="master-empty-state">
                  У мастера пока нет услуг. Сначала добавьте услуги в профиле мастера,
                  потом можно будет создать запись вручную.
                </p>
              ) : null}

              <label>
                <span>ID клиента</span>
                <input
                  value={manualForm.clientId}
                  onChange={(event) =>
                    setManualForm((currentForm) => ({
                      ...currentForm,
                      clientId: event.target.value,
                    }))
                  }
                  placeholder="Например, 3"
                  inputMode="numeric"
                />
              </label>

              <label>
                <span>Услуга</span>
                <select
                  value={selectedManualService?.id ?? ""}
                  onChange={(event) =>
                    setManualForm((currentForm) => ({
                      ...currentForm,
                      serviceId: event.target.value,
                      time: "",
                    }))
                  }
                  disabled={services.length === 0}
                >
                  {services.length > 0 ? (
                    services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.title} · {service.duration} мин ·{" "}
                        {service.price.toLocaleString("ru-RU")} ₽
                      </option>
                    ))
                  ) : (
                    <option value="">Нет услуг</option>
                  )}
                </select>
              </label>

              <div className="master-add-form__row">
                <label>
                  <span>Временной слот</span>
                  <select
                    value={selectedManualTime}
                    onChange={(event) =>
                      setManualForm((currentForm) => ({
                        ...currentForm,
                        time: event.target.value,
                      }))
                    }
                    disabled={manualBookingSlots.length === 0}
                  >
                    {manualBookingSlots.length > 0 ? (
                      manualBookingSlots.map((slot, index) => (
                        <option key={`manual-slot-${slot}-${index}`} value={slot}>
                          {slot}
                        </option>
                      ))
                    ) : (
                      <option value="">Нет свободных окон</option>
                    )}
                  </select>
                </label>

                <label>
                  <span>Статус</span>
                  <select
                    value={manualForm.status}
                    onChange={(event) =>
                      setManualForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="Ожидает подтверждения">Ожидает подтверждения</option>
                    <option value="Подтверждено">Подтверждено</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Комментарий</span>
                <textarea
                  value={manualForm.clientComment}
                  onChange={(event) =>
                    setManualForm((currentForm) => ({
                      ...currentForm,
                      clientComment: event.target.value,
                    }))
                  }
                  placeholder="Пожелания клиента или заметка мастера"
                  rows={3}
                />
              </label>

              <div className="master-add-form__actions">
                <button
                  type="submit"
                  disabled={
                    isManualBookingSaving ||
                    !selectedManualService ||
                    !selectedManualTime ||
                    !manualForm.clientId
                  }
                >
                  {isManualBookingSaving ? "Сохранение..." : "Сохранить запись"}
                </button>
                <button type="button" onClick={() => setIsAddFormOpen(false)}>
                  Отмена
                </button>
              </div>
            </form>
          ) : null}

          <div className="master-day-section">
            <h3>Записи клиентов</h3>
            <div className="master-appointments">
              {selectedAppointments.length > 0 ? (
                selectedAppointments.map((appointment, index) => (
                  <article
                    className="master-appointment-card"
                    key={`appointment-${selectedKey}-${appointment.id}-${index}`}
                  >
                    <div className="master-appointment-card__top">
                      <div>
                        <strong>{appointment.clientName}</strong>
                        <p>{appointment.service}</p>
                      </div>
                      <span className={`master-status master-status--${appointment.status}`}>
                        {statusText[appointment.status]}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Время</dt>
                        <dd>{appointment.time}</dd>
                      </div>
                      <div>
                        <dt>Длительность</dt>
                        <dd>{appointment.duration}</dd>
                      </div>
                      <div>
                        <dt>Стоимость</dt>
                        <dd>{appointment.price}</dd>
                      </div>
                    </dl>
                    {appointment.clientComment ? (
                      <p className="master-appointment-comment">
                        {appointment.clientComment}
                      </p>
                    ) : null}
                    <div className="master-appointment-actions">
                      <button
                        type="button"
                        disabled={openingChatBookingId === appointment.booking.id}
                        onClick={() => void handleOpenAppointmentChat(appointment.booking)}
                      >
                        {openingChatBookingId === appointment.booking.id
                          ? "Открываю..."
                          : "Открыть чат"}
                      </button>
                      <button
                        className="master-appointment-actions__status"
                        type="button"
                        disabled={isStatusSaving === appointment.id}
                        onClick={() => void handleChangeAppointmentStatus(appointment)}
                      >
                        {isStatusSaving === appointment.id
                          ? "Сохранение..."
                          : nextStatusButtonText[appointment.status]}
                      </button>
                      <button type="button" disabled>
                        Телефон не указан
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="master-empty-state">На этот день записей пока нет.</p>
              )}
            </div>
          </div>

          <div className="master-day-section">
            <h3>Свободные окна</h3>
            <div className="master-slots">
              {selectedFreeSlots.length > 0 ? (
                selectedFreeSlots.map((slot, index) => (
                  <button type="button" key={`slot-${selectedKey}-${slot}-${index}`}>
                    {slot}
                  </button>
                ))
              ) : (
                <p className="master-empty-state">Свободных окон нет.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
