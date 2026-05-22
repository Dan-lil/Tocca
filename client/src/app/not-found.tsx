"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./not-found.css";

const text = {
  bloodTubeTitle: "Та самая конфузная пробирка крови",
  bloodTubeText:
    "Пробирка давно стала частью доброй истории, которую вспоминают с улыбкой даже вне занятий",
  hatTitle: "Тарас мастер шляпных поисков",
  hatText:
    "Добытая шляпа перед шляпным ретро тоже осталась в памяти как маленький символ неожиданных, но очень живых моментов",
  title: "Небольшая пауза среди маршрутов",
  lead:
    "Пока нужная страница где-то по пути, здесь осталось немного теплых воспоминаний о совместной работе и занятиях.",
  memories: "Воспоминания",
  photoAlt: "Фото Тараса",
  thanks: "Поблагодарить",
  home: "На главную",
};

const memories = [
  {
    title: text.bloodTubeTitle,
    text: text.bloodTubeText,
    iconClass: "tube-icon",
    className: "memory-tube",
    hasLiquid: true,
  },
  {
    title: text.hatTitle,
    text: text.hatText,
    iconClass: "hat-icon",
    className: "memory-hat",
  },
];

const imagePath = (fileName: string) =>
  `/not-found/${encodeURIComponent(fileName)}`;

const stickersLibrary = [
  {
    id: 1,
    image: imagePath("тарас.webp"),
    caption: "Тарас - отец!",
  },
  {
    id: 2,
    image: imagePath("биба.webp"),
    caption: "Спасибо за Бибу",
  },
  {
    id: 3,
    image: imagePath("боба.webp"),
    caption: "Спасибо за Бобу",
  },
  {
    id: 4,
    image: imagePath("помидор.webp"),
    caption: "Помидоры",
  },
  {
    id: 5,
    image: imagePath("чемоданы.webp"),
    caption: "Чемоданы",
  },
  {
    id: 6,
    image: imagePath("кот-в-наушниках.webp"),
    caption: "Vous êtes adopté",
  },
  {
    id: 7,
    image: imagePath("сердце-хомяк.webp"),
    caption: "Taras est le meilleur",
  },
  {
    id: 8,
    image: imagePath("выпускной.webp"),
    caption: "Поздравляем всех с выпускным!",
  },
  {
    id: 9,
    image: imagePath("попугай-с-сигой.webp"),
    caption: "Спасибо за знания",
  },
  {
    id: 15,
    image: imagePath("юра.webp"),
    caption: "Юра, спасибо!",
  },
  {
    id: 16,
    image: imagePath("тарас-стикер.webp"),
    caption: "Тарас - спасибо!",
  },
];

const stickerLayout = [
  { x: 27, y: 20 },
  { x: 73, y: 20 },
  { x: 23, y: 34 },
  { x: 77, y: 34 },
  { x: 25, y: 47 },
  { x: 75, y: 47 },
  { x: 34, y: 38 },
  { x: 66, y: 38 },
  { x: 38, y: 56 },
  { x: 62, y: 56 },
  { x: 40, y: 46 },
  { x: 60, y: 46 },
];

type StickerItem = {
  uniqueId: number;
  image: string;
  caption: string;
  left: number | string;
  top: number | string;
};

export default function NotFoundPage() {
  const [stickers, setStickers] = useState<StickerItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const getStickerPosition = (stickerIndex: number) => {
    if (!containerRef.current) return { left: "50%", top: "50%" };

    const stageScene =
      containerRef.current.querySelector<HTMLElement>(".stage-scene");
    if (!stageScene) return { left: "50%", top: "50%" };

    const sceneRect = stageScene.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;
    const stickerWidth = isMobile ? 90 : 310;
    const stickerHeight = isMobile ? 115 : 430;
    const layout = stickerLayout[stickerIndex % stickerLayout.length];
    const rawLeft = (sceneRect.width * layout.x) / 100 - stickerWidth / 2;
    const rawTop = (sceneRect.height * layout.y) / 100 - stickerHeight / 2;
    const minLeft = 24;
    const maxLeft = Math.max(minLeft, sceneRect.width - stickerWidth - 24);
    const minTop = 20;
    const maxTop = Math.max(minTop, sceneRect.height - stickerHeight - 32);

    const left = Math.min(Math.max(rawLeft, minLeft), maxLeft);
    const top = Math.min(Math.max(rawTop, minTop), maxTop);

    return { left, top };
  };

  const addSticker = () => {
    const sticker = stickersLibrary[currentIndex];
    const { left, top } = getStickerPosition(currentIndex);

    const newSticker = {
      uniqueId: Date.now() + Math.random(),
      image: sticker.image,
      caption: sticker.caption,
      left,
      top,
    };

    setStickers((prev) => [...prev, newSticker]);
    setCurrentIndex((prev) => (prev + 1) % stickersLibrary.length);
  };

  const removeSticker = (uniqueId: number) => {
    setStickers((prev) =>
      prev.filter((sticker) => sticker.uniqueId !== uniqueId),
    );
  };

  return (
    <main className="not-found-page" ref={containerRef}>
      <section className="gratitude-stage">
        <header className="stage-header">
          <p className="stage-kicker">404</p>
          <h1>{text.title}</h1>
          <p className="stage-lead">{text.lead}</p>
        </header>

        <section className="stage-scene">
          <div className="stickers-layer" aria-hidden="true">
            {stickers.map((sticker) => (
              <div
                key={sticker.uniqueId}
                className="sticker"
                style={{
                  position: "absolute",
                  left: sticker.left,
                  top: sticker.top,
                  cursor: "pointer",
                  zIndex: 100,
                }}
                onClick={() => removeSticker(sticker.uniqueId)}
              >
                <div className="photo-sticker">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sticker.image} alt={sticker.caption} />
                </div>
                <div className="sticker-caption">{sticker.caption}</div>
              </div>
            ))}
          </div>

          <div className="ring ring-memories" aria-label={text.memories}>
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
                src="/not-found/teacher-sticker1.jpeg"
                alt={text.photoAlt}
                fill
                sizes="(max-width: 768px) 320px, 480px"
                loading="eager"
              />
            </div>
          </div>
        </section>

        <div className="stage-actions">
          <button className="add-sticker-btn" onClick={addSticker}>
            {text.thanks}
          </button>
          <Link className="hero-button" href="/">
            {text.home}
          </Link>
        </div>
      </section>
    </main>
  );
}
