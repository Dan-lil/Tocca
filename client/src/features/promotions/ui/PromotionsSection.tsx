"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { PromotionRedeemActions } from "@/features/promotions/ui/PromotionRedeemActions";
import { usePromotionsCarousel } from "@/shared/hooks/usePromotionsCarousel";

// Основная карусель акций на главной странице
type PromotionsSectionProps = {
  promotions: PromotionItem[];
};

const PROMOTION_IMAGE_FALLBACK = "/акция_дня.jpeg";

export function PromotionsSection({ promotions }: PromotionsSectionProps) {
  const promotionsRef = useRef<HTMLDivElement | null>(null);
  const promoCardsRef = useRef<Array<HTMLElement | null>>([]);
  const dragProxyRef = useRef<HTMLDivElement | null>(null);
  const [openPromotionId, setOpenPromotionId] = useState<number | null>(null);

  // Хук управляет drag и кнопками прокрутки карусели
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
          {promotions.map((promotion, index) => {
            const isPromoOpen = openPromotionId === promotion.id;

            return (
              <article
                className="promo-card"
                key={`promotion-${promotion.id}-${index}`}
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

                <div className={`promo-copy${isPromoOpen ? " promo-copy--panel-open" : ""}`}>
                  {!isPromoOpen ? (
                    <>
                      <p>{promotion.comment}</p>
                      <span className="promo-date">
                        Акция действует до {promotion.expiresAt}
                      </span>
                      <Link
                        className="promo-master promo-master-link"
                        href={`/masters/${promotion.masterId}`}
                      >
                        Мастер {promotion.masterName} ★ {promotion.masterRating.toFixed(1)}
                      </Link>
                    </>
                  ) : null}

                  <PromotionRedeemActions
                    promotion={promotion}
                    triggerClassName="glass-button glass-button--compact promo-link"
                    panelClassName="promo-code-panel"
                    copyButtonClassName="glass-button glass-button--compact promo-copy-button"
                    bookButtonClassName="glass-button glass-button--compact promo-book-button"
                    isOpen={isPromoOpen}
                    onToggle={(nextOpen) =>
                      setOpenPromotionId(nextOpen ? promotion.id : null)
                    }
                    keepTriggerVisible={!isPromoOpen}
                  />
                </div>
              </article>
            );
          })}
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
