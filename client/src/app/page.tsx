"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./page.css";

//услуги картинки тянутся с сервера
const services = [
  {
    title: "Ногти",
    image: "/услуги на главной/ногти9.jpg",
    description: "Уход, покрытие и дизайн",
  },
  {
    title: "Макияж",
    image: "/услуги на главной/макияж1.jpg",
    description: "Дневные и вечерние образы с естественным сиянием",
  },
  {
    title: "Массаж",
    image: "/услуги на главной/массаж8.jpg",
    description: "Расслабляющие ритуалы для тела и восстановления",
  },
  {
    title: "Косметология",
    image: "/услуги на главной/косметология11.jpg",
    description: "Процедуры для свежей кожи, ровного тона и твоей красоты",
  },
  {
    title: "Волосы",
    image: "/услуги на главной/прическа2.jpg",
    description:
      "Уход за волосами, укладки и прически под событие или настроение",
  },
];

// акции картинки тянутся с клиента
const promotions = [
  {
    title: "Массаж",
    subtitle: "Антицеллюлитный массаж со скидкой 25%",
    image: "/акции/anticellulite-massage-25.png",
  },
  {
    title: "Приведи подругу",
    subtitle: "Получите скидку 10% на следующую запись",
    image: "/акции/bring-friend-10-v2.png",
  },
  {
    title: "Брови и ресницы",
    subtitle: "Минус 15% на оформление взгляда",
    image: "/акции/brows-lashes-15.png",
  },
  {
    title: "Прически",
    subtitle: "Стрижка и укладка в подарок",
    image: "/акции/haircut-styling-gift.png",
  },
  {
    title: "Маникюр",
    subtitle: "Скидка 20% на первое посещение",
    image: "/акции/manicure-discount-20 (1).png",
  },
];

// мастера - заглушки для модалки
const masters = [
  {
    id: "ap",
    initials: "АП",
    name: "Анна Петрова",
    meta: "Маникюр-педикюр 7 лет опыта",
    service: "Маникюр с покрытием",
    price: "2 500 ₽ • 90 мин",
    slot: "19:00",
  },
  {
    id: "ek",
    initials: "ЕК",
    name: "Елена Козлова",
    meta: "Уход за кожей, маникюр 9 лет опыта",
    service: "Маникюр с покрытием",
    price: "3 000 ₽ • 90 мин",
    slot: "18:00",
  },
];

// варианты для запросы у AI
const quickPrompts = [
  "Хочу маникюр завтра после 18:00...",
  "Маникюр завтра вечером",
  "Стрижка в эти выходные",
];

export default function HomePage() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [draft, setDraft] = useState("Хочу маникюр завтра после 18:00...");

  
 // const promotionsRef = useRef<HTMLDivElement | null>(null); // Ref на контейнер акций для прокрутки кнопками в перспективе
  const inputRef = useRef<HTMLInputElement | null>(null); //ссылка для поля ввода в модалке

  // Пока модальное окно открыто блокируется прокрутка страницы
  useEffect(() => {
    document.body.style.overflow = isChatOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isChatOpen]);

  //закрывается окно когда жмякается Esc
  useEffect(() => {
    if (!isChatOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChatOpen]);


  return (
    <main className="home-page">
      <div className="page-shell">
        <section className="hero-section">
          <nav className="top-nav">
            <button>Домашняя страница</button>
            <button>Услуги</button>
            <button>Профиль</button>
            <button>AI Помощник</button>
            <button>Регистрация/Вход</button>
          </nav>

          <div className="hero-content">
            <div className="hero-offer">
              <p className="hero-eyebrow">Акции</p>
              <h1>Акция!!!! Массаж с окончанием только у нас за 9990!!!!</h1>
            </div>

            <div className="hero-actions">
              <button className="primary-button" type="button">
                Записаться
              </button>
            </div>
          </div>
        </section>

        {/* Секция с аишкой и карточками услуг */}
        <section className="services-section">
          <div className="hero-assistant-card">
            <div className="assistant-badge">AI</div>
            <div className="assistant-copy">
              <strong>AI - помощник</strong>
              <span>Опишите, что вы хотите - я найду подходящих мастеров</span>
            </div>
            <button
              className="small-button"
              type="button"
              onClick={() => setIsChatOpen(true)}
            >
              Записаться
            </button>
          </div>

          <div className="section-heading">
            <span>Услуги</span>
          </div>

          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <div className="service-media">
                  <Image src={service.image} alt={service.title} fill />
                </div>
                <div className="service-overlay">
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                  <button className="card-button" type="button">
                    Записаться
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Блок акций в перспективе с прокруткой */}
        <section className="promotions-section">
    

          {/* Контейнер ленты акций, который прокручивается в перспективе через ref */}
          <div className="promo-grid" >
            {promotions.map((promotion) => (
              <article className="promo-card" key={promotion.title}>
                <div className="promo-image">
                  <Image
                    src={promotion.image}
                    alt={promotion.title}
                    fill
                    sizes="(max-width: 767px) 78vw, (max-width: 1199px) 42vw, 26vw"
                  />
                </div>
                <div className="promo-copy">
                  <h3>{promotion.title}</h3>
                  <p>{promotion.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* кнопка для открытия модалки аишки */}
      <button
        className="chat-fab"
        type="button"
        onClick={() => setIsChatOpen(true)}
      >
        <span>AI</span>
      </button>

      {/* модалка аишка */}
      {isChatOpen ? (
        <div
          className="chat-modal-backdrop"
          role="presentation"
          onClick={() => setIsChatOpen(false)}
        >
          <section
            className="chat-modal booking-modal"
            onClick={(event) => event.stopPropagation()} //не дает закрыться модалке раньше времени
          >
            <div className="booking-intro">
              <p>
                Маникюр — хороший выбор! Нашел 2 мастера на 15 мая, после 18:00.
                Выберите удобный слот:
              </p>
            </div>

            <div className="booking-masters">
              {masters.map((master) => (
                <button className="master-card" key={master.id}>
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
              ))}
            </div>
            {/* ПОКА КАК ЗАГЛУШКА! - дальше будет отвечать чат */}
            <div className="booking-confirm">
              <p className="booking-confirm-title">Отлично! Вот ваша запись:</p>

              <article className="booking-summary-card">
                <div className="master-topline">
                  <span className="master-avatar">АП</span>
                  <div className="master-head">
                    <strong>Анна Петрова</strong>
                    <span>Маникюр с покрытием</span>
                  </div>
                </div>
                <p className="booking-summary-time">15 мая, пятница, 19:00</p>
                <p className="booking-summary-price">2 500 ₽ • 90 мин</p>
              </article>

              <button className="booking-confirm-button" type="button">
                Подтвердить запись
              </button>
            </div>

            {/* Нижний AI с полем ввода и подсказками для ввода */}
            <div className="booking-ai-panel">
              <div className="booking-ai-head">
                <div className="assistant-badge booking-ai-badge">AI</div>
                <div className="booking-ai-copy">
                  <strong>AI - помощник</strong>
                  <span>
                    Опишите, что вы хотите - я найду подходящих мастеров
                  </span>
                </div>
              </div>

              <div className="booking-ai-input-row">
                <input
                  ref={inputRef}
                  className="booking-ai-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)} //обновление состояния
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setDraft("");
                    }
                  }}
                  placeholder="Хочу маникюр завтра после 18:00..."
                />
                <button
                  className="booking-ai-button"
                  onClick={() => {
                    setDraft(""); //очищается поле ввода при нажатии на кнопку
                  }}
                >
                  Записаться
                </button>
              </div>

              <div className="booking-ai-chips">
                {quickPrompts.map((prompt) => (
                  <button
                    className="booking-chip"
                    key={prompt}
                    onClick={() => {
                      setDraft(prompt);
                      inputRef.current?.focus();
                    }} //обновление состояния перевод фокуса на инпут, чтобы при энтер очищалось поле
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
