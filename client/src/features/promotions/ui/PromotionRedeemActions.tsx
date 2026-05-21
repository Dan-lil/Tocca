"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import {
  BOOKING_MODAL_CLOSE_EVENT,
  dispatchBookingModalOpen,
} from "@/shared/lib/bookingEvents";

import styles from "./PromotionRedeemActions.module.css";

// Универсальный блок для промокода и записи, который используется и в шапке, и в карусели
type PromotionRedeemActionsProps = {
  promotion: PromotionItem;
  triggerClassName: string;
  panelClassName?: string;
  copyButtonClassName?: string;
  bookButtonClassName?: string;
  triggerLabel?: string;
  isOpen?: boolean;
  onToggle?: (nextOpen: boolean) => void;
  keepTriggerVisible?: boolean;
};

// Код строим из названия услуги, id акции 
function buildPromotionCode(promotion: PromotionItem) {
  const titleChunk = promotion.serviceTitle
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 4)
    .toUpperCase();
  const randomChunk =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 6).toUpperCase()
      : Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${titleChunk || "SALE"}-${promotion.id}-${randomChunk}`;
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function PromotionRedeemActions({
  promotion,
  triggerClassName,
  panelClassName,
  copyButtonClassName = "glass-button glass-button--compact",
  bookButtonClassName = "glass-button glass-button--compact",
  triggerLabel,
  isOpen: controlledIsOpen,
  onToggle,
  keepTriggerVisible = true,
}: PromotionRedeemActionsProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [promotionCode, setPromotionCode] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const t = useTranslations("promotions");
  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  const resolvedTriggerLabel = triggerLabel ?? t("usePromotion");

  const setIsOpen = useCallback((nextOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledIsOpen(nextOpen);
    }

    onToggle?.(nextOpen);
  }, [isControlled, onToggle]);

  // После закрытия модалки сбрасываем раскрытую акцию
  useEffect(() => {
    const handleBookingModalClose = () => {
      setIsOpen(false);
      setIsCopied(false);
    };

    window.addEventListener(BOOKING_MODAL_CLOSE_EVENT, handleBookingModalClose);

    return () => {
      window.removeEventListener(BOOKING_MODAL_CLOSE_EVENT, handleBookingModalClose);
    };
  }, [setIsOpen]);

  // Закрываем панель промокода по клику вне блока и по Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;

      setIsOpen(false);
      setIsCopied(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setIsOpen(false);
      setIsCopied(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen]);

  // При первом раскрытии генерируем код и сохраняем его в состоянии
  const handlePromoReveal = () => {
    setIsOpen(!isOpen);
    setPromotionCode((currentCode) => currentCode ?? buildPromotionCode(promotion));
  };

  // Даем пользователю быстро скопировать код перед записью
  const handlePromoCopy = async () => {
    if (!promotionCode || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(promotionCode);
      setIsCopied(true);
      window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setIsCopied(false);
    }
  };

  // Открываем общую модалку записи уже с выбранным мастером и услугами акции
  const handleBookingOpen = () => {
    dispatchBookingModalOpen({
      categoryId: promotion.categoryId,
      categoryTitle: promotion.serviceTitle,
      masterId: promotion.masterId,
      masterName: promotion.masterName,
      services: promotion.services,
    });
  };

  return (
    <>
      {keepTriggerVisible ? (
        <button
          className={joinClassNames(styles.trigger, triggerClassName)}
          type="button"
          onClick={handlePromoReveal}
        >
          {resolvedTriggerLabel}
        </button>
      ) : null}

      {isOpen ? (
        <div className={joinClassNames(styles.panel, panelClassName)} ref={panelRef}>
          <strong className={styles.code}>{promotionCode}</strong>
          <p className={styles.description}>{t("copyCodeHint")}</p>

          <div className={styles.actions}>
            <button
              className={joinClassNames(styles.actionButton, copyButtonClassName)}
              type="button"
              onClick={() => void handlePromoCopy()}
            >
              {isCopied ? t("codeCopied") : t("copyCode")}
            </button>

            <button
              className={joinClassNames(styles.actionButton, bookButtonClassName)}
              type="button"
              onClick={handleBookingOpen}
            >
              {t("book")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
