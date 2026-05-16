"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { usePromotionsCarousel } from "@/shared/hooks/usePromotionsCarousel";

// Компонент отвечает только за секцию акций на главной странице:
// принимает список акций, подключает карусель и рендерит управление

type PromotionsSectionProps = {
  promotions: PromotionItem[];
};

export function PromotionsSection({
  promotions,
}: PromotionsSectionProps) {
  // Ref нужны GSAP-карусели для управления контейнером, карточками и drag-слоем
  const promotionsRef = useRef<HTMLDivElement | null>(null);
  const promoCardsRef = useRef<Array<HTMLElement | null>>([]);
  const dragProxyRef = useRef<HTMLDivElement | null>(null);

  // Подключение GSAP-карусели акций через общий хук
  const promotionsApiRef = usePromotionsCarousel({
    cardsCount: promotions.length,
    containerRef: promotionsRef,
    cardsRef: promoCardsRef,
    dragProxyRef,
  });

  return (
    <section className="promotions-section">
      {/* Блок акций с GSAP-каруселью и кнопками переключения */}
      <div className="promo-header">
        <div className="section-heading promotions-heading">
          <span>Акции</span>
        </div>
      </div>

      {/* ----- Разметка GSAP-карусели акций: начало ----- */}
      <div className="promo-carousel-shell">
        <div className="promo-grid" ref={promotionsRef}>
          {promotions.map((promotion, index) => (
            <article
              className="promo-card"
              key={promotion.title}
              ref={(node) => {
                promoCardsRef.current[index] = node;
              }}
            >
              <div className="promo-image">
                <Image src={promotion.image} alt={promotion.title} fill />
              </div>
              <div className="promo-copy">
                <p>{promotion.subtitle}</p>
                <Link
                  className="glass-button glass-button--compact promo-link"
                  href="#"
                >
                  Воспользоваться акцией
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="promo-drag-proxy" ref={dragProxyRef} />
      </div>
      {/* ----- Разметка GSAP-карусели акций: конец ----- */}

      {/* Кнопки управляют GSAP-каруселью через API из usePromotionsCarousel */}
      <div className="promo-controls">
        <button
          className="promo-scroll-button"
          type="button"
          onClick={() => promotionsApiRef.current?.prev()}
          aria-label="Прокрутить акции влево"
        >
          &lsaquo;
        </button>
        <button
          className="promo-scroll-button"
          type="button"
          onClick={() => promotionsApiRef.current?.next()}
          aria-label="Прокрутить акции вправо"
        >
          &rsaquo;
        </button>
      </div>
    </section>
  );
}
