"use client";

import { useMemo, useState } from "react";
import styles from "./BookingCalendarModal.module.css";

export type BookingService = {
  id: number;
  masterId: number;
  title: string;
  duration: number;
  price: number;
};

export type BookingMaster = {
  id: number;
  name: string;
  title: string;
  category: string;
};

export type BookingPayload = {
  clientId: number;
  masterId: number;
  serviziId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending";
  clientComment: string;
};

type BookingCalendarModalProps = {
  clientId: number;
  master: BookingMaster;
  service: BookingService;
  availableSlotsByDate: Record<string, string[]>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: BookingPayload) => void;
};

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const emptySlots: string[] = [];

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

function getDateTimeIso(dateKey: string, time: string, duration: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const startDate = new Date(`${dateKey}T00:00:00`);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + duration);

  return {
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };
}

export default function BookingCalendarModal({
  clientId,
  master,
  service,
  availableSlotsByDate,
  isOpen,
  onClose,
  onSubmit,
}: BookingCalendarModalProps) {
  const initialDate = useMemo(() => {
    const firstAvailableDate = Object.keys(availableSlotsByDate)[0];

    return firstAvailableDate ? new Date(`${firstAvailableDate}T00:00:00`) : new Date();
  }, [availableSlotsByDate]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [clientComment, setClientComment] = useState("");

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDateSlots = availableSlotsByDate[selectedDateKey] ?? emptySlots;
  const activeSlot = selectedDateSlots.includes(selectedSlot)
    ? selectedSlot
    : selectedDateSlots[0] ?? "";
  const monthDays = useMemo(
    () => getMonthDays(selectedDate.getFullYear(), selectedDate.getMonth()),
    [selectedDate],
  );
  const monthTitle = selectedDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(direction: number) {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + direction, 1),
    );
    setSelectedSlot("");
  }

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedSlot("");
  }

  function handleSubmit() {
    if (!activeSlot) {
      return;
    }

    const { startTime, endTime } = getDateTimeIso(
      selectedDateKey,
      activeSlot,
      service.duration,
    );

    onSubmit({
      clientId,
      masterId: master.id,
      serviziId: service.id,
      date: new Date(`${selectedDateKey}T00:00:00`).toISOString(),
      startTime,
      endTime,
      status: "pending",
      clientComment,
    });
    setClientComment("");
    setSelectedSlot("");
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles["booking-modal-backdrop"]}>
      <section className={styles["booking-modal"]} aria-modal="true" role="dialog">
        <div className={styles["booking-modal-header"]}>
          <div>
            <p>Запись к мастеру</p>
            <h2>{service.title}</h2>
            <span>
              {master.name} · {master.title}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть модальное окно">
            ×
          </button>
        </div>

        <div className={styles["booking-modal-body"]}>
          <div className={styles["booking-calendar-panel"]}>
            <div className={styles["booking-calendar-toolbar"]}>
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц">
                ‹
              </button>
              <h3>{monthTitle}</h3>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Следующий месяц">
                ›
              </button>
            </div>

            <div className={styles["booking-weekdays"]}>
              {weekDays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className={styles["booking-calendar-grid"]}>
              {monthDays.map((date, index) => {
                if (!date) {
                  return <div className={styles["booking-day-empty"]} key={index} />;
                }

                const dateKey = toDateKey(date);
                const slotsCount = availableSlotsByDate[dateKey]?.length ?? 0;
                const isSelected = dateKey === selectedDateKey;

                return (
                  <button
                    className={`${styles["booking-day"]} ${
                      isSelected ? styles["booking-day-selected"] : ""
                    }`}
                    key={dateKey}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                  >
                    <span>{date.getDate()}</span>
                    {slotsCount > 0 && <small>{slotsCount} окон</small>}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className={styles["booking-summary"]}>
            <div className={styles["booking-service-card"]}>
              <p>Услуга</p>
              <strong>{service.title}</strong>
              <span>
                {service.duration} мин · {service.price.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            <div className={styles["booking-slot-section"]}>
              <h3>
                {selectedDate.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <div className={styles["booking-slots"]}>
                {selectedDateSlots.length > 0 ? (
                  selectedDateSlots.map((slot) => (
                    <button
                      className={slot === activeSlot ? styles["booking-slot-selected"] : ""}
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))
                ) : (
                  <p>На этот день свободных окон пока нет.</p>
                )}
              </div>
            </div>

            <label className={styles["booking-comment"]}>
              <span>Комментарий</span>
              <textarea
                value={clientComment}
                onChange={(event) => setClientComment(event.target.value)}
                placeholder="Можно указать пожелания к записи"
              />
            </label>

            <button
              className={styles["booking-submit"]}
              type="button"
              disabled={!activeSlot}
              onClick={handleSubmit}
            >
              Записаться
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
