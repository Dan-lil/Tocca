"use client";

import { useEffect, useRef } from "react";

// Общий хук для GSAP-карусели на главной странице (из библиотеки)
// не рендерит, а только связывает DOM-элементы с библиотечной анимацией

type PromotionsCarouselApi = {
  next: () => void;
  prev: () => void;
};

type UsePromotionsCarouselOptions = {
  cardsCount: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cardsRef: React.RefObject<Array<HTMLElement | null>>;
  dragProxyRef: React.RefObject<HTMLDivElement | null>;
};

export function usePromotionsCarousel({
  cardsCount,
  containerRef,
  cardsRef,
  dragProxyRef,
}: UsePromotionsCarouselOptions) {
  const apiRef = useRef<PromotionsCarouselApi | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let cleanup: (() => void) | undefined;

    // ----- Код библиотеки GSAP для карусели акций: начало -----
    const setupPromotionsCarousel = async () => {
      const container = containerRef.current;
      const dragProxy = dragProxyRef.current;
      const cards = cardsRef.current.filter(
        (card): card is HTMLElement => Boolean(card),
      );

      if (!container || !dragProxy || cards.length === 0 || cardsCount === 0) return;

      // Импорт модулей библиотеки GSAP и плагина Draggable
      const { gsap } = await import("gsap");
      const { Draggable } = await import("gsap/Draggable");

      if (isCancelled) return;

      gsap.registerPlugin(Draggable);

      const wrapIndex = gsap.utils.wrap(0, cards.length);
      const normalizeProgress = gsap.utils.wrap(0, cards.length);
      const snapIndex = gsap.utils.snap(1);
      let activeIndex = 0;
      let currentProgress = 0;
      let dragStartIndex = 0;
      let tween: ReturnType<typeof gsap.to> | null = null;

      // Вспомогательная логика GSAP для бесшовного зацикливания карточек
      const getLoopDelta = (index: number, current: number) => {
        let delta = index - current;

        if (delta > cards.length / 2) delta -= cards.length;
        if (delta < -cards.length / 2) delta += cards.length;

        return delta;
      };

      // Основная GSAP-анимация: позиция, масштаб, прозрачность и поворот карточек
      const renderCards = (progress: number, animate = true) => {
        const cardWidth = cards[0]?.offsetWidth ?? 320;
        const gap = Math.max(cardWidth * (window.innerWidth < 768 ? 0.5 : 0.68), 150);
        const normalizedProgress = normalizeProgress(progress);

        currentProgress = progress;
        activeIndex = wrapIndex(Math.round(normalizedProgress));

        cards.forEach((card, index) => {
          const delta = getLoopDelta(index, normalizedProgress);
          const distance = Math.abs(delta);

          gsap.to(card, {
            x: delta * gap,
            scale: Math.max(0.72, 1 - distance * 0.14),
            opacity: Math.max(0.18, 1 - distance * 0.24),
            rotation: delta * -7,
            zIndex: Math.round(100 - distance * 10),
            duration: animate ? 0.55 : 0,
            ease: "power3.out",
          });
        });
      };

      // Плавный GSAP-переход к следующей позиции по кнопке или после drag
      const animateToIndex = (value: number) => {
        tween?.kill();

        const proxy = { value: currentProgress };

        tween = gsap.to(proxy, {
          value,
          duration: 0.7,
          ease: "power3.inOut",
          onUpdate: () => renderCards(proxy.value),
          onComplete: () => {
            renderCards(proxy.value, false);
          },
        });
      };

      apiRef.current = {
        next: () => animateToIndex(currentProgress + 1),
        prev: () => animateToIndex(currentProgress - 1),
      };

      // Подключение GSAP Draggable для свайпа и перетаскивания
      const draggable = Draggable.create(dragProxy, {
        type: "x",
        trigger: container,
        allowContextMenu: true,
        onPress() {
          tween?.kill();
          dragStartIndex = currentProgress;
          gsap.set(dragProxy, { x: 0 });
        },
        onDrag() {
          renderCards(dragStartIndex - this.x / 260);
        },
        onDragEnd() {
          const snappedIndex = snapIndex(dragStartIndex - this.x / 260);
          animateToIndex(snappedIndex);
          gsap.set(dragProxy, { x: 0 });
        },
      })[0];

      // Пересчёт GSAP-позиций при изменении размера окна
      const handleResize = () => renderCards(activeIndex, false);

      window.addEventListener("resize", handleResize);
      renderCards(activeIndex, false);

      cleanup = () => {
        // Очистка нужна, чтобы при размонтировании страницы не оставались анимации и listeners
        apiRef.current = null;
        tween?.kill();
        draggable.kill();
        window.removeEventListener("resize", handleResize);
      };
    };

    void setupPromotionsCarousel();

    return () => {
      isCancelled = true;
      cleanup?.();
    };
    // ----- Код библиотеки GSAP для карусели акций: конец -----
  }, [cardsCount, cardsRef, containerRef, dragProxyRef]);

  return apiRef;
}
