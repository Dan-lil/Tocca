"use client";

import "./page.css";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  createShadule,
  getShadulesByMaster,
  updateShadule,
} from "@/shared/api/shaduleApi";
import { refreshTokenThunk } from "@/entities/user/api/UserApiThunk";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import type { ShaduleType } from "@/shared/types";

type Appointment = {
  id: number;
  clientName: string;
  service: string;
  time: string;
  duration: string;
  price: string;
  status: "confirmed" | "pending" | "done";
  phone: string;
};

type MasterService = {
  id: string;
  name: string;
  duration: string;
  price: string;
};

const masterServices: MasterService[] = [
  {
    id: "manicure-gel",
    name: "Маникюр + покрытие",
    duration: "1 ч 40 мин",
    price: "3 200 ₽",
  },
  {
    id: "brows",
    name: "Коррекция бровей",
    duration: "45 мин",
    price: "1 400 ₽",
  },
  {
    id: "styling",
    name: "Укладка",
    duration: "1 ч",
    price: "2 500 ₽",
  },
  {
    id: "face-massage",
    name: "Массаж лица",
    duration: "1 ч 20 мин",
    price: "4 000 ₽",
  },
];

const initialAppointments: Record<string, Appointment[]> = {
  "2026-05-15": [
    {
      id: 1,
      clientName: "Анна Смирнова",
      service: "Маникюр + покрытие",
      time: "10:00",
      duration: "1 ч 40 мин",
      price: "3 200 ₽",
      status: "confirmed",
      phone: "+7 999 123-45-67",
    },
    {
      id: 2,
      clientName: "Мария Волкова",
      service: "Коррекция бровей",
      time: "14:30",
      duration: "45 мин",
      price: "1 400 ₽",
      status: "pending",
      phone: "+7 999 555-22-11",
    },
  ],
  "2026-05-17": [
    {
      id: 3,
      clientName: "Екатерина Орлова",
      service: "Укладка",
      time: "12:00",
      duration: "1 ч",
      price: "2 500 ₽",
      status: "confirmed",
      phone: "+7 999 700-80-90",
    },
  ],
  "2026-05-21": [
    {
      id: 4,
      clientName: "София Белова",
      service: "Массаж лица",
      time: "16:00",
      duration: "1 ч 20 мин",
      price: "4 000 ₽",
      status: "done",
      phone: "+7 999 444-10-10",
    },
  ],
};

const initialFreeSlots: Record<string, string[]> = {
  "2026-05-15": ["12:00", "13:00", "16:00", "17:30"],
  "2026-05-16": ["09:00", "10:30", "12:00", "15:00", "18:00"],
  "2026-05-17": ["09:30", "10:30", "15:00", "17:00"],
  "2026-05-18": ["11:00", "12:30", "14:00", "16:30"],
  "2026-05-21": ["10:00", "11:30", "13:00"],
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const emptySlots: string[] = [];
const scheduleDays = [
  { dayOdWeek: 1, label: "Понедельник" },
  { dayOdWeek: 2, label: "Вторник" },
  { dayOdWeek: 3, label: "Среда" },
  { dayOdWeek: 4, label: "Четверг" },
  { dayOdWeek: 5, label: "Пятница" },
  { dayOdWeek: 6, label: "Суббота" },
  { dayOdWeek: 0, label: "Воскресенье" },
];
const statusText = {
  confirmed: "Подтверждена",
  pending: "Ждет ответа",
  done: "Завершена",
};

const nextStatus: Record<Appointment["status"], Appointment["status"]> = {
  pending: "confirmed",
  confirmed: "done",
  done: "pending",
};

const nextStatusButtonText: Record<Appointment["status"], string> = {
  pending: "Подтвердить",
  confirmed: "Завершить",
  done: "Вернуть в ожидание",
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

function getPhoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

type ScheduleDraft = {
  id?: number;
  dayOdWeek: number;
  label: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
};

function getTimeValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "09:00";
  }

  return `${date.getHours()}`.padStart(2, "0") + `:${date.getMinutes()}`.padStart(2, "0");
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

function getScheduleDate(dayOdWeek: number, time: string) {
  const monday = new Date(2024, 6, 1);
  const date = new Date(monday);
  const dayOffset = dayOdWeek === 0 ? 6 : dayOdWeek - 1;
  const [hours, minutes] = time.split(":").map(Number);

  date.setDate(monday.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);

  return date.toISOString();
}

export default function CalendarMasterPage() {
  const dispatch = useAppDispatch();
  const { user, isInitialized } = useAppSelector((state) => state.user);
  const scheduleMasterId = user?.role === "master" ? user.id : undefined;
  const today = new Date(2026, 4, 15);
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointmentsByDate, setAppointmentsByDate] = useState(initialAppointments);
  const [freeSlotsByDate, setFreeSlotsByDate] = useState(initialFreeSlots);
  const [scheduleDrafts, setScheduleDrafts] = useState<ScheduleDraft[]>(
    getInitialScheduleDrafts(),
  );
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    serviceId: masterServices[0].id,
    time: initialFreeSlots[toDateKey(today)]?.[0] ?? "",
    status: "pending" as Appointment["status"],
  });
  const selectedKey = toDateKey(selectedDate);
  const selectedAppointments = appointmentsByDate[selectedKey] ?? [];
  const selectedFreeSlots = freeSlotsByDate[selectedKey] ?? emptySlots;
  const selectedTime = selectedFreeSlots.includes(form.time)
    ? form.time
    : selectedFreeSlots[0] ?? "";
  const selectedService =
    masterServices.find((service) => service.id === form.serviceId) ?? masterServices[0];
  const monthDays = useMemo(
    () => getMonthDays(selectedDate.getFullYear(), selectedDate.getMonth()),
    [selectedDate]
  );
  const monthTitle = selectedDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
  const scheduleAccessError =
    isInitialized && !scheduleMasterId
      ? "Войдите как мастер, чтобы загрузить и сохранить расписание."
      : null;

  useEffect(() => {
    if (!isInitialized) {
      void dispatch(refreshTokenThunk());
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!scheduleMasterId) {
      return;
    }

    const loadSchedule = async () => {
      try {
        setIsScheduleLoading(true);
        setScheduleError(null);
        const shadules = await getShadulesByMaster(scheduleMasterId);
        setScheduleDrafts(getInitialScheduleDrafts(shadules));
      } catch {
        setScheduleDrafts(getInitialScheduleDrafts());
        setScheduleError("Расписание пока не найдено, можно сохранить новое.");
      } finally {
        setIsScheduleLoading(false);
      }
    };

    void loadSchedule();
  }, [isInitialized, scheduleMasterId]);

  function changeMonth(direction: number) {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1)
    );
  }

  function handleAddAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.lastName.trim() || !form.firstName.trim() || !form.phone.trim() || !selectedTime) {
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now(),
      clientName: `${form.lastName.trim()} ${form.firstName.trim()}`,
      service: selectedService.name,
      time: selectedTime,
      duration: selectedService.duration,
      price: selectedService.price,
      status: form.status,
      phone: form.phone.trim(),
    };

    setAppointmentsByDate((currentAppointments) => ({
      ...currentAppointments,
      [selectedKey]: [...(currentAppointments[selectedKey] ?? []), newAppointment].sort((a, b) =>
        a.time.localeCompare(b.time)
      ),
    }));

    setFreeSlotsByDate((currentSlots) => ({
      ...currentSlots,
      [selectedKey]: (currentSlots[selectedKey] ?? []).filter((slot) => slot !== selectedTime),
    }));

    setForm((currentForm) => ({
      ...currentForm,
      lastName: "",
      firstName: "",
      phone: "",
      time: selectedFreeSlots.filter((slot) => slot !== selectedTime)[0] ?? "",
      status: "pending",
    }));
    setIsAddFormOpen(false);
  }

  function handleChangeAppointmentStatus(appointmentId: number) {
    setAppointmentsByDate((currentAppointments) => ({
      ...currentAppointments,
      [selectedKey]: (currentAppointments[selectedKey] ?? []).map((appointment) => {
        if (appointment.id !== appointmentId) {
          return appointment;
        }

        return {
          ...appointment,
          status: nextStatus[appointment.status],
        };
      }),
    }));
  }

  function updateScheduleDraft(dayOdWeek: number, patch: Partial<ScheduleDraft>) {
    setScheduleDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.dayOdWeek === dayOdWeek ? { ...draft, ...patch } : draft,
      ),
    );
  }

  async function handleSaveSchedule() {
    if (!scheduleMasterId) {
      setScheduleError("Войдите как мастер, чтобы сохранить расписание.");
      return;
    }

    try {
      setIsScheduleSaving(true);
      setScheduleError(null);
      setScheduleMessage(null);

      await Promise.all(
        scheduleDrafts.map(async (draft) => {
          const payload = {
            masterId: scheduleMasterId,
            dayOdWeek: draft.dayOdWeek,
            startTime: getScheduleDate(draft.dayOdWeek, draft.startTime),
            endTime: getScheduleDate(draft.dayOdWeek, draft.endTime),
            isWorkingDay: draft.isWorkingDay,
          };
          const savedShadule = draft.id
            ? await updateShadule(draft.id, payload)
            : await createShadule(payload);

          return { ...draft, id: savedShadule.id };
        }),
      );

      const reloadedShadules = await getShadulesByMaster(scheduleMasterId);
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
        <button
          className="master-calendar-primary"
          type="button"
          onClick={() => setIsAddFormOpen((isOpen) => !isOpen)}
        >
          Добавить запись
        </button>
      </section>

      <section className="master-schedule-panel">
        <div className="master-schedule-panel__header">
          <div>
            <p className="master-calendar-kicker">Рабочая неделя</p>
            <h2>Расписание мастера</h2>
          </div>
          <button
            className="master-calendar-primary"
            type="button"
            disabled={isScheduleSaving || isScheduleLoading || !scheduleMasterId}
            onClick={() => void handleSaveSchedule()}
          >
            {isScheduleSaving ? "Сохранение..." : "Сохранить график"}
          </button>
        </div>

        {scheduleAccessError || scheduleError ? (
          <p className="master-schedule-message">{scheduleAccessError ?? scheduleError}</p>
        ) : null}
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

          {isAddFormOpen && (
            <form className="master-add-form" onSubmit={handleAddAppointment}>
              <h3>Добавить запись</h3>

              <label>
                <span>Услуга</span>
                <select
                  value={form.serviceId}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      serviceId: event.target.value,
                    }))
                  }
                >
                  {masterServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {service.duration} · {service.price}
                    </option>
                  ))}
                </select>
              </label>

              <div className="master-add-form__row">
                <label>
                  <span>Фамилия клиента</span>
                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        lastName: event.target.value,
                      }))
                    }
                    placeholder="Иванова"
                  />
                </label>
                <label>
                  <span>Имя клиента</span>
                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        firstName: event.target.value,
                      }))
                    }
                    placeholder="Анна"
                  />
                </label>
              </div>

              <label>
                <span>Номер телефона</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+7 999 123-45-67"
                  type="tel"
                />
              </label>

              <div className="master-add-form__row">
                <label>
                  <span>Временной слот</span>
                  <select
                    value={selectedTime}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        time: event.target.value,
                      }))
                    }
                    disabled={selectedFreeSlots.length === 0}
                  >
                    {selectedFreeSlots.length > 0 ? (
                      selectedFreeSlots.map((slot, index) => (
                        <option key={`form-slot-${selectedKey}-${slot}-${index}`} value={slot}>
                          {slot}
                        </option>
                      ))
                    ) : (
                      <option value="">Нет свободных окон</option>
                    )}
                  </select>
                </label>

                <label>
                  <span>Начальный статус</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        status: event.target.value as Appointment["status"],
                      }))
                    }
                  >
                    <option value="pending">Ждет ответа</option>
                    <option value="confirmed">Подтверждена</option>
                  </select>
                </label>
              </div>

              <div className="master-add-form__actions">
                <button type="submit" disabled={selectedFreeSlots.length === 0}>
                  Сохранить запись
                </button>
                <button type="button" onClick={() => setIsAddFormOpen(false)}>
                  Отмена
                </button>
              </div>
            </form>
          )}

          <div className="master-day-section">
            <h3>Записи клиентов</h3>
            <div className="master-appointments">
              {selectedAppointments.length > 0 ? (
                selectedAppointments.map((appointment, index) => (
                  <article
                    className="master-appointment-card"
                    key={`appointment-${selectedKey}-${appointment.id}-${appointment.time}-${index}`}
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
                    <div className="master-appointment-actions">
                      <button type="button">Открыть чат</button>
                      <button
                        className="master-appointment-actions__status"
                        type="button"
                        onClick={() => handleChangeAppointmentStatus(appointment.id)}
                      >
                        {nextStatusButtonText[appointment.status]}
                      </button>
                      <a href={getPhoneHref(appointment.phone)}>Позвонить</a>
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
                <p className="master-empty-state">Свободных окон пока не добавлено.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
