  'use client'
  import React, { useState, useRef } from 'react';
  import Image from "next/image";
  import Link from "next/link";
  import "./not-found.css";

  const memories = [
    {
      title: "Та самая конфузная пробирка крови",
      text: "Пробирка давно стала частью доброй истории, которую вспоминают с улыбкой даже вне занятий",
      iconClass: "tube-icon",
      className: "memory-tube",
      hasLiquid: true,
    },
    {
      title: "Тарас мастер шляпных поисков",
      text: "Добытая шляпа перед шляпным ретро тоже осталась в памяти как маленький символ неожиданных, но очень живых моментов",
      iconClass: "hat-icon",
      className: "memory-hat",
    },
  ];

  const stickersLibrary = [
    {
      id: 1,
      image: "/not-found/тарас.webp",      
      caption: "Тарас - отец! 🐱"
    },
    {
      id: 2,
      image: "/not-found/биба.webp",      
      caption: "Спасибо за Бибу"
    },
    {
      id: 3,
      image: "/not-found/боба.webp",     
      caption: "Спасибо за Бобу"
    },
    {
      id: 4,
      image: "/not-found/помидор.webp",     
      caption: "Помидоры"
    },
    {
      id: 5,
      image: "/not-found/чемоданы.webp",    
      caption: "Чемоданы"
    },
    {
      id: 6,
      image: "/not-found/кот-в-наушниках.webp",    
      caption: "Vous êtes adopté"
    },
    {
      id: 7,
      image: "/not-found/сердце-хомяк.webp",    
      caption: "Taras est le meilleur "
    },
    {
      id: 8,
      image: "/not-found/выпускной.webp",    
      caption: "ПОЗДРАВЛЯЕМ ВСЕХ С ВЫПУСКНЫМ♥️"
    },
    {
      id: 9,
      image: "/not-found/попугай-с-сигой.webp",     
      caption: "Спасибо за знания"
    },
    {
      id: 11,
      image: "/not-found/димон.webp",    
      caption: "Димоооооооооооооон"
    },
    {
      id: 13,
      image: "/not-found/сердечко.webp",     
      caption: "Какими мы пришли"
    },
    {
      id: 14,
      image: "/not-found/загрузка.webp",    
      caption: "Какими мы уходим"
    },
    {
      id: 15,
      image: "/not-found/юра.webp",     
      caption: "Юра, спасибо!♥️"
    },
    {
      id: 16,
      image: "/not-found/тарас-стикер.webp",    
      caption: "Тарас - спасибо!♥️"
    },
  ];

  export default function NotFoundPage() {
    const [stickers, setStickers] = useState([]);
    const containerRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // рандом место
const getRandomPosition = () => {
  if (!containerRef.current) return { left: '50%', top: '50%' };
  
  const gratitudeStage = containerRef.current.querySelector('.gratitude-stage');
  if (!gratitudeStage) return { left: '50%', top: '50%' };
  
  const stageRect = gratitudeStage.getBoundingClientRect();
  const containerRect = containerRef.current.getBoundingClientRect();
  const relativeLeft = stageRect.left - containerRect.left;
  const relativeTop = stageRect.top - containerRect.top;
  const stickerWidth = 110;
  const stickerHeight = 130;
  
  const minLeft = relativeLeft + 20;
  const maxLeft = relativeLeft + stageRect.width - stickerWidth - 20;
  const minTop = relativeTop + 180;  // Отступ от верхнего края
  const maxTop = relativeTop + 500;  // Ограничилавысоту
  
  const left = Math.random() * (maxLeft - minLeft) + minLeft;
  const top = Math.random() * (maxTop - minTop) + minTop;
  
  return { left, top };
};

    const addSticker = () => {
      const sticker = stickersLibrary[currentIndex];
      const { left, top } = getRandomPosition();
      
      const newSticker = {
        uniqueId: Date.now() + Math.random(),
        image: sticker.image,
        caption: sticker.caption,
        left: left,
        top: top,
      };
      setStickers(prev => [...prev, newSticker]);
      setCurrentIndex((prev) => (prev + 1) % stickersLibrary.length);
    };

    // Удаление стикера
    const removeSticker = (uniqueId) => {
      setStickers(prev => prev.filter(sticker => sticker.uniqueId !== uniqueId));
    };

    return (
      <main className="not-found-page" ref={containerRef}>
        <section className="gratitude-stage">
          <header className="stage-header">
            <p className="stage-kicker">404</p>
            <h1>Небольшая пауза среди маршрутов</h1>
            <p className="stage-lead">
              Пока нужная страница где-то по пути, здесь осталось немного теплых
              воспоминаний о совместной работе и занятиях
            </p>
          </header>

          <section className="stage-scene">
            <div className="stickers-layer" aria-hidden="true">
            {stickers.map((sticker) => (
              <div
                   key={sticker.uniqueId}
                   className="sticker"
                   style={{
                        position: 'absolute',
                            left: sticker.left,
                            top: sticker.top,
                            cursor: 'pointer',
                            zIndex: 100,
             }}
                   onClick={() => removeSticker(sticker.uniqueId)}
    >
                <div className="photo-sticker">
                  <img 
                    src={sticker.image} 
                    alt={sticker.caption}
                  />
                </div>
                <div className="sticker-caption">{sticker.caption}</div>
              </div>
            ))}
          </div>

            <div className="ring ring-memories" aria-label="Воспоминания">
              {memories.map((memory) => (
                <article
                  className={`memory-card ${memory.className}`}
                  key={memory.title}
                >
                  <div className="memory-badge">
                    <span className={`memory-icon ${memory.iconClass}`}>
                      {memory.hasLiquid ? (
                        <span className="tube-liquid"></span>
                      ) : null}
                    </span>
                    <span>{memory.title}</span>
                  </div>
                  <p>{memory.text}</p>
                </article>
              ))}
            </div>

            <div className="center-sticker">
              <div className="sticker-shadow"></div>
              <div className="photo-sticker">
                <Image
                  src="/not-found/teacher-sticker.jpeg"
                  alt="Фото Тараса"
                  fill
                  sizes="(max-width: 768px) 320px, 480px"
                  loading="eager"
                />
              </div>
            </div>
          </section>

            <div className="stage-actions">
             <button className="add-sticker-btn" onClick={addSticker}>
              💝 Поблагодарить 💝
            </button>
           <Link className="hero-button" href="/">
              На главную
            </Link>
          </div>
        </section>
      </main>
    );
  }