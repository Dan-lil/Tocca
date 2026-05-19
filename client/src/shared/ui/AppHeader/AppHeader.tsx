"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { getDailyPromotions } from "@/features/promotions/lib/promotionUtils";
import type { PromotionItem } from "@/features/promotions/model/promotions.data";
import { PromotionRedeemActions } from "@/features/promotions/ui/PromotionRedeemActions";
import { logoutThunk } from "@/entities/user/api/UserApiThunk";
import { getCategories } from "@/shared/api/categoryApi";
import { getSales } from "@/shared/api/saleApi";
import { getServices } from "@/shared/api/serviziApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import type { CategoryType } from "@/shared/types";

// Верхняя навигация и блок акций дня в шапке
const navigationItems = [
  { href: "/", label: "Домашняя страница" },
  { href: "#", label: "AI Помощник", action: "open-chat" as const },
];

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.user);
  const isHomePage = pathname === "/";

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [dailyPromotions, setDailyPromotions] = useState<PromotionItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Эта кнопка открывает общий сценарий записи через AI модалку
  const handleOpenChat = () => {
    dispatchBookingModalOpen();
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/auth");
  };

  // Загружаем категории для dropdown меню услуг
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        setCategoriesError(null);
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        setCategoriesError(
          error instanceof Error ? error.message : "Не удалось загрузить категории",
        );
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    void loadCategories();
  }, []);

  // На главной странице отдельно собираем две лучшие акции дня
  useEffect(() => {
    if (!isHomePage) return;

    const loadDailyPromotions = async () => {
      try {
        const [servicesData, salesData] = await Promise.all([
          getServices(),
          getSales(),
        ]);

        setDailyPromotions(getDailyPromotions(salesData, servicesData));
      } catch {
        setDailyPromotions([]);
      }
    };

    void loadDailyPromotions();
  }, [isHomePage]);

  // Закрываем dropdown, если пользователь кликнул вне него
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const dropdownCategories = useMemo(
    () => categories.filter((category) => category.title.trim()),
    [categories],
  );

  return (
    <header className="site-header">
      <div className="site-header-shell">
        <div className="site-header-content">
          <nav className="top-nav glass-surface" aria-label="Основная навигация">
            {navigationItems.map((item) =>
              item.action === "open-chat" ? (
                <button
                  className="glass-button glass-button--compact top-nav-link"
                  key={item.label}
                  type="button"
                  onClick={handleOpenChat}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  className="glass-button glass-button--compact top-nav-link"
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ),
            )}

            {user ? (
              <Link className="glass-button glass-button--compact top-nav-link" href="/Profile">
                Профиль
              </Link>
            ) : null}

            <div className="top-nav-dropdown" ref={dropdownRef}>
              <button
                className="glass-button glass-button--compact top-nav-link top-nav-button"
                type="button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                Услуги
              </button>

              {isDropdownOpen ? (
                <div className="top-nav-dropdown-menu glass-surface" role="menu">
                  {isCategoriesLoading ? (
                    <span className="top-nav-dropdown-state">Загрузка категорий</span>
                  ) : null}

                  {categoriesError ? (
                    <span className="top-nav-dropdown-state">{categoriesError}</span>
                  ) : null}

                  {!isCategoriesLoading && !categoriesError
                    ? dropdownCategories.map((category) => (
                        <Link
                          className="top-nav-dropdown-link"
                          href={`/services/${category.id}`}
                          key={`header-category-${category.id}`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {category.title}
                        </Link>
                      ))
                    : null}
                </div>
              ) : null}
            </div>

            {user ? (
              <button
                className="glass-button glass-button--compact top-nav-link"
                type="button"
                onClick={handleLogout}
              >
                Выйти
              </button>
            ) : (
              <Link className="glass-button glass-button--compact top-nav-link" href="/auth">
                Регистрация/Вход
              </Link>
            )}
          </nav>

          {isHomePage ? (
            <div className="site-header-promo">
              <div className="site-header-promo-heading">
                <span>Акции дня</span>
              </div>

              <div className="site-header-promotions-grid">
                {dailyPromotions.map((promotion) => (
                  // В шапке показываем только отобранные акции дня
                  <article className="site-header-offer" key={`header-promo-${promotion.id}`}>
                    <div className="site-header-offer-media">
                      <Image src={promotion.image} alt={promotion.title} fill unoptimized />
                    </div>

                    <div className="site-header-offer-copy">
                      <span>Мастер {promotion.masterName}</span>
                      <div
                        className="promotion-card-rating"
                        aria-label={`Рейтинг ${promotion.masterRating.toFixed(1)}`}
                      >
                        <span className="promotion-card-rating-star">★</span>
                        <strong>{promotion.masterRating.toFixed(1)}</strong>
                      </div>

                      <PromotionRedeemActions
                        promotion={promotion}
                        triggerClassName="glass-button glass-button--compact promo-link"
                        panelClassName="promo-code-panel"
                        copyButtonClassName="glass-button glass-button--compact promo-copy-button"
                        bookButtonClassName="glass-button glass-button--compact promo-book-button"
                      />
                    </div>
                  </article>
                ))}

                {dailyPromotions.length === 0 ? (
                  <div className="site-header-promo-empty glass-surface">
                    <span>Акции загружаются</span>
                    <button
                      className="glass-button site-header-button"
                      type="button"
                      onClick={handleOpenChat}
                    >
                      Записаться
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
