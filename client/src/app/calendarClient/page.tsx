"use client";

import { useState } from "react";
import BookingCalendarModal, {
  type BookingPayload,
  type BookingService,
} from "@/features/booking/ui/BookingCalendarModal/BookingCalendarModal";
import "./page.css";

type ClientMaster = {
  id: number;
  name: string;
  title: string;
  category: string;
  rating: number;
  address: string;
  image: string;
  services: BookingService[];
  slots: Record<string, string[]>;
};

const clientId = 3;

const masters: ClientMaster[] = [
  {
    id: 2,
    name: "Оля",
    title: "Супер Мастер ЕКБ",
    category: "Маникюр",
    rating: 4.8,
    address: "Улица Длинная, дом 10",
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=80",
    services: [
      {
        id: 1,
        masterId: 2,
        title: "Наращивание ногтей гель-лаком",
        duration: 60,
        price: 10000,
      },
      {
        id: 3,
        masterId: 2,
        title: "Маникюр + покрытие",
        duration: 100,
        price: 3200,
      },
    ],
    slots: {
      "2026-05-18": ["10:00", "12:00", "16:30"],
      "2026-05-19": ["09:30", "11:00", "15:00", "18:00"],
      "2026-05-21": ["10:30", "13:00", "17:30"],
      "2026-05-24": ["12:00", "14:00"],
    },
  },
  {
    id: 4,
    name: "Анна",
    title: "Nail artist",
    category: "Маникюр",
    rating: 4.6,
    address: "Проспект Мира, 8",
    image:
      "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=700&q=80",
    services: [
      {
        id: 4,
        masterId: 4,
        title: "Аппаратный маникюр",
        duration: 75,
        price: 2600,
      },
      {
        id: 5,
        masterId: 4,
        title: "Дизайн ногтей",
        duration: 45,
        price: 1800,
      },
    ],
    slots: {
      "2026-05-18": ["13:00", "17:00"],
      "2026-05-20": ["10:00", "12:30", "15:30"],
      "2026-05-22": ["11:30", "16:00"],
    },
  },
];

export default function CalendarClientPage() {
  const [selectedMaster, setSelectedMaster] = useState<ClientMaster | null>(null);
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [createdBooking, setCreatedBooking] = useState<BookingPayload | null>(null);

  function openBooking(master: ClientMaster, service: BookingService) {
    setSelectedMaster(master);
    setSelectedService(service);
    setCreatedBooking(null);
  }

  function closeBooking() {
    setSelectedMaster(null);
    setSelectedService(null);
  }

  function handleBookingSubmit(payload: BookingPayload) {
    setCreatedBooking(payload);
    closeBooking();
  }

  return (
    <main className="client-calendar-page">
      <section className="client-calendar-hero">
        <p>Категория</p>
        <h1>Маникюр</h1>
        <span>Выберите мастера, услугу, день и удобное время записи.</span>
      </section>

      {createdBooking && (
        <section className="client-booking-result">
          <strong>Заявка создана локально</strong>
          <p>
            Услуга #{createdBooking.serviziId}, мастер #{createdBooking.masterId},{" "}
            {new Date(createdBooking.startTime).toLocaleString("ru-RU", {
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </section>
      )}

      <section className="client-master-list">
        {masters.map((master) => (
          <article className="client-master-card" key={master.id}>
            <img src={master.image} alt={master.title} />
            <div className="client-master-card-content">
              <div className="client-master-card-top">
                <div>
                  <p>{master.category}</p>
                  <h2>{master.name}</h2>
                  <span>{master.title}</span>
                </div>
                <strong>{master.rating}</strong>
              </div>

              <p className="client-master-address">{master.address}</p>

              <div className="client-service-list">
                {master.services.map((service) => (
                  <button
                    className="client-service-card"
                    key={service.id}
                    type="button"
                    onClick={() => openBooking(master, service)}
                  >
                    <span>{service.title}</span>
                    <small>
                      {service.duration} мин · {service.price.toLocaleString("ru-RU")} ₽
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      {selectedMaster && selectedService && (
        <BookingCalendarModal
          clientId={clientId}
          master={selectedMaster}
          service={selectedService}
          availableSlotsByDate={selectedMaster.slots}
          isOpen
          onClose={closeBooking}
          onSubmit={handleBookingSubmit}
        />
      )}
    </main>
  );
}
