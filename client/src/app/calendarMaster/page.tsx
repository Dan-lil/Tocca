"use client";

import "./page.css";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { useLocale, useTranslations } from "next-intl";
=======
import { io } from "socket.io-client";
>>>>>>> bd624dad4bf17e3c8d63b434feb8ae3ae8c221e8
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

const nextStatus: Record<AppointmentStatus, AppointmentStatus> = {
  pending: "confirmed",
  confirmed: "done",
  done: "pending",
  canceled: "pending",
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

function getDurationLabel(booking: BookingType, service: ServiziType | undefined, minutesLabel: string) {
  if (service?.duration) {
    return `${service.duration} ${minutesLabel}`;
  }

  const diffMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  return diffMinutes > 0 ? `${diffMinutes} ${minutesLabel}` : "—";
}

function getPriceLabel(service: ServiziType | undefined, locale: string) {
  return service ? `${service.price.toLocaleString(locale)} ₽` : "—";
}

function isBookingCanceled(booking: BookingType) {
  return getAppointmentStatus(booking.status) === "canceled";
}

function buildAppointmentsByDate(
  bookings: BookingType[],
  services: ServiziType[],
  labels: {
    clientNumber: (id: number) => string;
    serviceNumber: (id: number) => string;
    minutes: string;
  },
  locale: string,
) {
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
      clientName: labels.clientNumber(booking.clientId),
      clientComment: booking.clientComment,
      service: service?.title ?? labels.serviceNumber(booking.serviziId),
      time: startDate.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }),
      duration: getDurationLabel(booking, service, labels.minutes),
      price: getPriceLabel(service, locale),
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
  const t = useTranslations("masterCalendar");
  const commonT = useTranslations("common");
  const locale = useLocale();
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
  const calendarWeekDays = t.raw("weekDays") as string[];
  const scheduleDayLabels = t.raw("scheduleDays") as string[];
  const statusLabels: Record<AppointmentStatus, string> = {
    confirmed: t("statusConfirmed"),
    pending: t("statusPending"),
    done: t("statusDone"),
    canceled: t("statusCanceled"),
  };
  const nextStatusLabels: Record<AppointmentStatus, string> = {
    pending: t("nextPending"),
    confirmed: t("nextConfirmed"),
    done: t("nextDone"),
    canceled: t("nextCanceled"),
  };
  const monthTitle = selectedDate.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
  const appointmentsByDate = useMemo(
    () =>
      buildAppointmentsByDate(
        bookings,
        services,
        {
          clientNumber: (id) => t("clientNumber", { id }),
          serviceNumber: (id) => t("serviceNumber", { id }),
          minutes: commonT("minutes"),
        },
        locale,
      ),
    [bookings, commonT, locale, services, t],
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
      ? t("accessError")
      : null;

  useEffect(() => {
    if (!isInitialized) {
      void dispatch(refreshTokenThunk());
    }
  }, [dispatch, isInitialized]);

  const loadMasterCalendarData = useCallback(async (currentMasterId: number) => {
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
        setScheduleError(t("scheduleMissing"));
      }
    } finally {
      setIsPageLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isInitialized || !masterId) return;

    void loadMasterCalendarData(masterId);
  }, [isInitialized, loadMasterCalendarData, masterId]);

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
      setPageError(error instanceof Error ? error.message : t("chatError"));
    } finally {
      setOpeningChatBookingId(null);
    }
  }

  async function handleCreateManualBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!masterId || !selectedManualService || !selectedManualTime) {
      setManualBookingError(t("chooseServiceAndSlot"));
      return;
    }

    const clientId = Number(manualForm.clientId);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      setManualBookingError(t("invalidClientId"));
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
        error instanceof Error ? error.message : t("createBookingError"),
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
      setScheduleError(t("saveScheduleAuth"));
      return;
    }

    const emptyWorkingDay = scheduleDrafts.find(
      (draft) => draft.isWorkingDay && draft.slots.length === 0,
    );

    if (emptyWorkingDay) {
      setScheduleError(t("emptyWorkingDay", { day: emptyWorkingDay.label }));
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
            t("saveSlotError", {
              day: slot.label,
              time: slot.time,
              message: error instanceof Error ? error.message : t("serverError"),
            }),
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
      setScheduleMessage(t("scheduleSaved"));
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : t("saveScheduleError"),
      );
    } finally {
      setIsScheduleSaving(false);
    }
  }

  return (
    <main className="master-calendar-page">
      <section className="master-calendar-hero">
        <div>
          <p className="master-calendar-kicker">{t("kicker")}</p>
          <h1>{t("title")}</h1>
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
            {t("addBooking")}
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
            <p className="master-calendar-kicker">{t("workWeek")}</p>
            <h2>{t("scheduleTitle")}</h2>
          </div>
          <button
            className="master-calendar-primary"
            type="button"
            disabled={isScheduleSaving || isPageLoading || !masterId}
            onClick={() => void handleSaveSchedule()}
          >
            {isScheduleSaving ? commonT("saving") : t("saveSchedule")}
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
                <span>{scheduleDayLabels[index] ?? draft.label}</span>
              </label>

              <div className="master-schedule-day__time">
                <label>
                  <span>{t("newSlot")}</span>
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
                  {t("addSlot")}
                </button>
                <div className="master-schedule-slots">
                  {draft.slots.length > 0 ? (
                    draft.slots.map((slot) => (
                      <button
                        type="button"
                        key={`${draft.dayOdWeek}-${slot.time}`}
                        disabled={!draft.isWorkingDay}
                        onClick={() => removeScheduleSlot(draft.dayOdWeek, slot.time)}
                        aria-label={t("deleteSlot", { time: slot.time })}
                      >
                        {slot.time} x
                      </button>
                    ))
                  ) : (
                    <p>{t("noSlotsAdded")}</p>
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
            <button type="button" onClick={() => changeMonth(-1)} aria-label={t("prevMonth")}>
              ‹
            </button>
            <h2>{monthTitle}</h2>
            <button type="button" onClick={() => changeMonth(1)} aria-label={t("nextMonth")}>
              ›
            </button>
          </div>

          <div className="master-calendar-weekdays">
            {calendarWeekDays.map((day) => (
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
                    {dayAppointments > 0 ? t("appointmentsCount", { count: dayAppointments }) : t("noAppointmentsShort")}
                  </span>
                  {dayFreeSlots > 0 && (
                    <span className="master-calendar-day__slots">{t("freeSlotsCount", { count: dayFreeSlots })}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="master-day-panel">
          <div className="master-day-panel__header">
            <div>
              <p>{t("selectedDay")}</p>
              <h2>
                {selectedDate.toLocaleDateString(locale, {
                  day: "numeric",
                  month: "long",
                })}
              </h2>
            </div>
            <span>{t("appointmentsCount", { count: selectedAppointments.length })}</span>
          </div>

          {isAddFormOpen ? (
            <form className="master-add-form" onSubmit={handleCreateManualBooking}>
              <h3>{t("addBooking")}</h3>

              {manualBookingError ? (
                <p className="master-form-error">{manualBookingError}</p>
              ) : null}

              {services.length === 0 ? (
                <p className="master-empty-state">
                  {t("noMasterServices")}
                </p>
              ) : null}

              <label>
                <span>{t("clientId")}</span>
                <input
                  value={manualForm.clientId}
                  onChange={(event) =>
                    setManualForm((currentForm) => ({
                      ...currentForm,
                      clientId: event.target.value,
                    }))
                  }
                  placeholder={t("clientIdPlaceholder")}
                  inputMode="numeric"
                />
              </label>

              <label>
                <span>{t("service")}</span>
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
                        {service.title} · {service.duration} {commonT("minutes")} ·{" "}
                        {service.price.toLocaleString(locale)} ₽
                      </option>
                    ))
                  ) : (
                    <option value="">{t("noServices")}</option>
                  )}
                </select>
              </label>

              <div className="master-add-form__row">
                <label>
                  <span>{t("timeSlot")}</span>
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
                      <option value="">{t("noFreeSlots")}</option>
                    )}
                  </select>
                </label>

                <label>
                  <span>{t("status")}</span>
                  <select
                    value={manualForm.status}
                    onChange={(event) =>
                      setManualForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="Ожидает подтверждения">{t("pendingBackend")}</option>
                    <option value="Подтверждено">{t("confirmedBackend")}</option>
                  </select>
                </label>
              </div>

              <label>
                <span>{t("comment")}</span>
                <textarea
                  value={manualForm.clientComment}
                  onChange={(event) =>
                    setManualForm((currentForm) => ({
                      ...currentForm,
                      clientComment: event.target.value,
                    }))
                  }
                  placeholder={t("commentPlaceholder")}
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
                  {isManualBookingSaving ? commonT("saving") : t("saveBooking")}
                </button>
                <button type="button" onClick={() => setIsAddFormOpen(false)}>
                  {commonT("cancel")}
                </button>
              </div>
            </form>
          ) : null}

          <div className="master-day-section">
            <h3>{t("clientBookings")}</h3>
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
                        {statusLabels[appointment.status]}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>{t("time")}</dt>
                        <dd>{appointment.time}</dd>
                      </div>
                      <div>
                        <dt>{t("duration")}</dt>
                        <dd>{appointment.duration}</dd>
                      </div>
                      <div>
                        <dt>{t("price")}</dt>
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
                          ? commonT("opening")
                          : t("openChat")}
                      </button>
                      <button
                        className="master-appointment-actions__status"
                        type="button"
                        disabled={isStatusSaving === appointment.id}
                        onClick={() => void handleChangeAppointmentStatus(appointment)}
                      >
                        {isStatusSaving === appointment.id
                          ? commonT("saving")
                          : nextStatusLabels[appointment.status]}
                      </button>
                      <button type="button" disabled>
                        {t("phoneMissing")}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="master-empty-state">{t("noBookingsToday")}</p>
              )}
            </div>
          </div>

          <div className="master-day-section">
            <h3>{t("freeSlots")}</h3>
            <div className="master-slots">
              {selectedFreeSlots.length > 0 ? (
                selectedFreeSlots.map((slot, index) => (
                  <button type="button" key={`slot-${selectedKey}-${slot}-${index}`}>
                    {slot}
                  </button>
                ))
              ) : (
                <p className="master-empty-state">{t("noFreeSlotsToday")}</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
