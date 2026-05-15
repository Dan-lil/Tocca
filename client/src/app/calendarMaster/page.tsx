"use client";

import "./page.css";
import { type FormEvent, useMemo, useState } from "react";

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

export default function CalendarMasterPage() {
  const today = new Date(2026, 4, 15);
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointmentsByDate, setAppointmentsByDate] = useState(initialAppointments);
  const [freeSlotsByDate, setFreeSlotsByDate] = useState(initialFreeSlots);
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
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="master-calendar-grid">
            {monthDays.map((date, index) => {
              if (!date) {
                return <div className="master-calendar-day master-calendar-day-empty" key={index} />;
              }

              const dateKey = toDateKey(date);
              const dayAppointments = appointmentsByDate[dateKey]?.length ?? 0;
              const dayFreeSlots = freeSlotsByDate[dateKey]?.length ?? 0;
              const isSelected = dateKey === selectedKey;

              return (
                <button
                  className={`master-calendar-day ${
                    isSelected ? "master-calendar-day-selected" : ""
                  }`}
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="master-calendar-day-number">{date.getDate()}</span>
                  <span className="master-calendar-day-meta">
                    {dayAppointments > 0 ? `${dayAppointments} записи` : "нет записей"}
                  </span>
                  {dayFreeSlots > 0 && (
                    <span className="master-calendar-day-slots">{dayFreeSlots} окон</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="master-day-panel">
          <div className="master-day-panel-header">
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

              <div className="master-add-form-row">
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

              <div className="master-add-form-row">
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
                      selectedFreeSlots.map((slot) => (
                        <option key={slot} value={slot}>
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

              <div className="master-add-form-actions">
                <button
                  className="master-add-form-save"
                  type="submit"
                  disabled={selectedFreeSlots.length === 0}
                >
                  Сохранить запись
                </button>
                <button
                  className="master-add-form-cancel"
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}

          <div className="master-day-section">
            <h3>Записи клиентов</h3>
            <div className="master-appointments">
              {selectedAppointments.length > 0 ? (
                selectedAppointments.map((appointment) => (
                  <article className="master-appointment-card" key={appointment.id}>
                    <div className="master-appointment-card-top">
                      <div>
                        <strong>{appointment.clientName}</strong>
                        <p>{appointment.service}</p>
                      </div>
                      <span className={`master-status master-status-${appointment.status}`}>
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
                      <button className="master-appointment-chat" type="button">
                        Открыть чат
                      </button>
                      <button
                        className="master-appointment-status-action"
                        type="button"
                        onClick={() => handleChangeAppointmentStatus(appointment.id)}
                      >
                        {nextStatusButtonText[appointment.status]}
                      </button>
                      <a className="master-appointment-call" href={getPhoneHref(appointment.phone)}>
                        Позвонить
                      </a>
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
                selectedFreeSlots.map((slot) => <button type="button" key={slot}>{slot}</button>)
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
