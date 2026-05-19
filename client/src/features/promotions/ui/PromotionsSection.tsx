"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { usePromotionsCarousel } from "@/shared/hooks/usePromotionsCarousel";

type PromotionsSectionProps = {
  promotions: PromotionItem[];
};

const PROMOTION_IMAGE_FALLBACK = "/акция_дня.jpeg";

export function PromotionsSection({ promotions }: PromotionsSectionProps) {
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

  if (promotions.length === 0) {
    return (
      <section className="promotions-section">
        <div className="promo-header">
          <div className="section-heading promotions-heading">
            <span>Акции</span>
          </div>
        </div>

        <div className="promo-empty-state">
          <p>Скоро здесь появятся актуальные предложения</p>
        </div>
      </section>
    );
  }

  return (
    <section className="promotions-section">
      <div className="promo-header">
        <div className="section-heading promotions-heading">
          <span>Акции</span>
        </div>
      </div>

      <div className="promo-carousel-shell">
        <div className="promo-grid" ref={promotionsRef}>
          {promotions.map((promotion, index) => (
            <article
              className="promo-card"
              key={promotion.id}
              ref={(node) => {
                promoCardsRef.current[index] = node;
              }}
            >
              <div className="promo-image">
                <Image
                  src={promotion.image || PROMOTION_IMAGE_FALLBACK}
                  alt={promotion.title}
                  fill
                  unoptimized
                />
              </div>
              <div className="promo-copy">
                <p>{promotion.comment}</p>
                <span className="promo-date">Акция действует до {promotion.expiresAt}</span>
                <span className="promo-master">{promotion.masterName}</span>
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
