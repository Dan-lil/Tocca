"use client";

import "./page.css";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { createBooking, getBookingsByMaster, updateBooking } from "@/shared/api/bookingApi";
import { getServicesByMaster } from "@/shared/api/serviziApi";
import {
  createShadule,
  getShadulesByMaster,
  updateShadule,
} from "@/shared/api/shaduleApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
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
  id?: number;
  dayOdWeek: number;
  label: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
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

function getTimeInputMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
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
  const latestShadules = [...shadules].sort((a, b) => {
    const updatedDiff =
      new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();

    return updatedDiff || b.id - a.id;
  });

  return scheduleDays.map((day) => {
    const shadule = latestShadules.find((item) => item.dayOdWeek === day.dayOdWeek);

    return {
      id: shadule?.id,
      dayOdWeek: day.dayOdWeek,
      label: day.label,
      startTime: shadule ? getTimeValue(shadule.startTime) : "09:00",
      endTime: shadule ? getTimeValue(shadule.endTime) : "18:00",
      isWorkingDay: shadule?.isWorkingDay ?? (day.dayOdWeek !== 0 && day.dayOdWeek !== 6),
    };
  });
}

function getAppointmentStatus(status: string): AppointmentStatus {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("отмен")) return "canceled";
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
    const startMinutes = getMinutesFromDate(getScheduleDate(schedule.dayOdWeek, schedule.startTime));
    const endMinutes = getMinutesFromDate(getScheduleDate(schedule.dayOdWeek, schedule.endTime));
    const dayBookings = bookings.filter((booking) => {
      const bookingDateKey = toDateKey(new Date(booking.startTime));

      return bookingDateKey === dateKey && !isBookingCanceled(booking);
    });
    const slots: string[] = [];

    for (let slotStart = startMinutes; slotStart + 30 <= endMinutes; slotStart += 30) {
      const slotEnd = slotStart + 30;
      const hasConflict = dayBookings.some((booking) => {
        const bookedStart = getMinutesFromDate(booking.startTime);
        const bookedEnd = getMinutesFromDate(booking.endTime);

        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (!hasConflict) {
        slots.push(formatMinutes(slotStart));
      }
    }

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

  if (!schedule || !duration) return [];

  const dateKey = toDateKey(date);
  const startMinutes = getMinutesFromDate(getScheduleDate(schedule.dayOdWeek, schedule.startTime));
  const endMinutes = getMinutesFromDate(getScheduleDate(schedule.dayOdWeek, schedule.endTime));
  const dayBookings = bookings.filter((booking) => {
    const bookingDateKey = toDateKey(new Date(booking.startTime));

    return bookingDateKey === dateKey && !isBookingCanceled(booking);
  });
  const slots: string[] = [];

  for (let slotStart = startMinutes; slotStart + duration <= endMinutes; slotStart += 30) {
    const slotEnd = slotStart + duration;
    const hasConflict = dayBookings.some((booking) => {
      const bookedStart = getMinutesFromDate(booking.startTime);
      const bookedEnd = getMinutesFromDate(booking.endTime);

      return slotStart < bookedEnd && slotEnd > bookedStart;
    });

    if (!hasConflict) {
      slots.push(formatMinutes(slotStart));
    }
  }

  return slots;
}

export default function CalendarMasterPage() {
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

  function changeMonth(direction: number) {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1),
    );
  }

  async function handleRefresh() {
    if (!masterId) return;

    await loadMasterCalendarData(masterId);
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

  async function handleSaveSchedule() {
    if (!masterId) {
      setScheduleError("Войдите как мастер, чтобы сохранить расписание.");
      return;
    }

    const invalidDraft = scheduleDrafts.find((draft) => {
      if (!draft.isWorkingDay) return false;

      return getTimeInputMinutes(draft.endTime) <= getTimeInputMinutes(draft.startTime);
    });

    if (invalidDraft) {
      setScheduleError(`Проверьте ${invalidDraft.label}: время окончания должно быть позже начала.`);
      return;
    }

    try {
      setIsScheduleSaving(true);
      setScheduleError(null);
      setScheduleMessage(null);

      for (const draft of scheduleDrafts) {
        try {
          const payload = {
            masterId,
            dayOdWeek: draft.dayOdWeek,
            startTime: getScheduleDate(draft.dayOdWeek, draft.startTime),
            endTime: getScheduleDate(draft.dayOdWeek, draft.endTime),
            isWorkingDay: draft.isWorkingDay,
          };

          if (draft.id) {
            await updateShadule(draft.id, payload);
          } else {
            await createShadule(payload);
          }
        } catch (error) {
          throw new Error(
            `Не удалось сохранить ${draft.label}: ${
              error instanceof Error ? error.message : "ошибка сервера"
            }`,
          );
        }
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
          <button
            className="master-calendar-primary"
            type="button"
            disabled={!masterId || isPageLoading}
            onClick={() => void handleRefresh()}
          >
            {isPageLoading ? "Загрузка..." : "Обновить данные"}
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
              key={`schedule-${draft.dayOdWeek}-${draft.id ?? index}`}
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
                  <span>С</span>
                  <input
                    type="time"
                    value={draft.startTime}
                    disabled={!draft.isWorkingDay}
                    onChange={(event) =>
                      updateScheduleDraft(draft.dayOdWeek, {
                        startTime: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span>До</span>
                  <input
                    type="time"
                    value={draft.endTime}
                    disabled={!draft.isWorkingDay}
                    onChange={(event) =>
                      updateScheduleDraft(draft.dayOdWeek, {
                        endTime: event.target.value,
                      })
                    }
                  />
                </label>
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
                      <button type="button">Открыть чат</button>
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
