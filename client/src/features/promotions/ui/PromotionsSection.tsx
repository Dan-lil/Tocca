"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { usePromotionsCarousel } from "@/shared/hooks/usePromotionsCarousel";
import {
  BOOKING_MODAL_CLOSE_EVENT,
  dispatchBookingModalOpen,
} from "@/shared/lib/bookingEvents";

type PromotionsSectionProps = {
  promotions: PromotionItem[];
};

const PROMOTION_IMAGE_FALLBACK = "/Р°РєС†РёСЏ_РґРЅСЏ.jpeg";

function buildPromotionCode(promotion: PromotionItem) {
  const titleChunk = promotion.serviceTitle
    .replace(/[^a-zA-Zа-яА-Я0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  const randomChunk =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 6).toUpperCase()
      : Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${titleChunk || "SALE"}-${promotion.id}-${randomChunk}`;
}

export function PromotionsSection({ promotions }: PromotionsSectionProps) {
  const promotionsRef = useRef<HTMLDivElement | null>(null);
  const promoCardsRef = useRef<Array<HTMLElement | null>>([]);
  const dragProxyRef = useRef<HTMLDivElement | null>(null);
  const openPanelRef = useRef<HTMLDivElement | null>(null);
  const [openPromotionId, setOpenPromotionId] = useState<number | null>(null);
  const [promotionCodes, setPromotionCodes] = useState<Record<number, string>>({});
  const [copiedPromotionId, setCopiedPromotionId] = useState<number | null>(null);

  const promotionsApiRef = usePromotionsCarousel({
    cardsCount: promotions.length,
    containerRef: promotionsRef,
    cardsRef: promoCardsRef,
    dragProxyRef,
  });

  useEffect(() => {
    const handleBookingModalClose = () => {
      setOpenPromotionId(null);
      setCopiedPromotionId(null);
    };

    window.addEventListener(BOOKING_MODAL_CLOSE_EVENT, handleBookingModalClose);

    return () => {
      window.removeEventListener(BOOKING_MODAL_CLOSE_EVENT, handleBookingModalClose);
    };
  }, []);

  useEffect(() => {
    if (openPromotionId === null) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (openPanelRef.current?.contains(target)) return;

      setOpenPromotionId(null);
      setCopiedPromotionId(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setOpenPromotionId(null);
      setCopiedPromotionId(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openPromotionId]);

  const handlePromoReveal = (promotion: PromotionItem) => {
    setOpenPromotionId((currentId) =>
      currentId === promotion.id ? null : promotion.id,
    );

    setPromotionCodes((currentCodes) => {
      if (currentCodes[promotion.id]) {
        return currentCodes;
      }

      return {
        ...currentCodes,
        [promotion.id]: buildPromotionCode(promotion),
      };
    });
  };

  const handlePromoCopy = async (promotionId: number) => {
    const promoCode = promotionCodes[promotionId];
    if (!promoCode || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(promoCode);
      setCopiedPromotionId(promotionId);
      window.setTimeout(() => {
        setCopiedPromotionId((currentId) =>
          currentId === promotionId ? null : currentId,
        );
      }, 2000);
    } catch {
      setCopiedPromotionId(null);
    }
  };

  const handleBookingOpen = (promotion: PromotionItem) => {
    dispatchBookingModalOpen({
      categoryId: promotion.categoryId,
      categoryTitle: promotion.serviceTitle,
      masterId: promotion.masterId,
      masterName: promotion.masterName,
      services: promotion.services,
    });
  };

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
            const promoCode = promotionCodes[promotion.id];

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
                <div className="promo-copy">
                  <p>{promotion.comment}</p>
                  <span className="promo-date">
                    Акция действует до {promotion.expiresAt}
                  </span>
                  <span className="promo-master">Мастер {promotion.masterName}</span>

                  <button
                    className="glass-button glass-button--compact promo-link"
                    type="button"
                    onClick={() => handlePromoReveal(promotion)}
                  >
                    Воспользоваться акцией
                  </button>

                  {isPromoOpen ? (
                    <div
                      className="promo-code-panel"
                      ref={(node) => {
                        openPanelRef.current = node;
                      }}
                    >
                      <strong className="promo-code-value">{promoCode}</strong>
                      <p className="promo-code-description">
                        Скопируйте код и добавьте его в комментарий при записи на
                        услугу к мастеру
                      </p>

                      <div className="promo-code-actions">
                        <button
                          className="glass-button glass-button--compact promo-copy-button"
                          type="button"
                          onClick={() => void handlePromoCopy(promotion.id)}
                        >
                          {copiedPromotionId === promotion.id
                            ? "Код скопирован"
                            : "Скопировать код"}
                        </button>

                        <button
                          className="glass-button glass-button--compact promo-book-button"
                          type="button"
                          onClick={() => handleBookingOpen(promotion)}
                        >
                          Записаться
                        </button>
                      </div>
                    </div>
                  ) : null}
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
