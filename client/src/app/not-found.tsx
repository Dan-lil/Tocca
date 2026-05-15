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

const orbitStickers = [
  "/not-found/orbit-sticker-1.jpeg",
  "/not-found/orbit-sticker-2.jpeg",
  "/not-found/orbit-sticker-3.jpeg",
  "/not-found/orbit-sticker-4.jpeg",
  "/not-found/orbit-sticker-5.jpeg",
  "/not-found/orbit-sticker-6.jpeg",
];

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
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
          <div className="mini-stickers" aria-hidden="true">
            {orbitStickers.map((src, index) => (
              <div className={`mini-sticker mini-${index + 1}`} key={src}>
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="120px"
                />
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
              />
            </div>
          </div>
        </section>

        <div className="stage-actions">
          <Link className="hero-button" href="/">
            На главную
          </Link>
        </div>
      </section>
    </main>
  );
}
