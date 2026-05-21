"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
import { getLocalizedTitle } from "@/shared/lib/localized";
import type { CategoryType } from "@/shared/types";
import LanguageSwitcher from "@/shared/ui/LanguageSwitcher/LanguageSwitcher";

type HeaderNavigationItem = {
  href: string;
  label: string;
  action?: "open-chat";
};

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.user);
  const t = useTranslations();
  const locale = useLocale();
  const isHomePage = pathname === "/";
  const localizedNavigationItems: HeaderNavigationItem[] = [
    { href: "/", label: t("header.home") },
    { href: "#", label: t("header.aiAssistant"), action: "open-chat" },
  ];

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
          <nav className="top-nav glass-surface" aria-label={t("header.mainNavigation")}>
            {localizedNavigationItems.map((item) =>
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
                {t("header.profile")}
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
                {t("header.services")}
              </button>

              {isDropdownOpen ? (
                <div className="top-nav-dropdown-menu glass-surface" role="menu">
                  {isCategoriesLoading ? (
                    <span className="top-nav-dropdown-state">{t("header.categoriesLoading")}</span>
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
                          {getLocalizedTitle(category, locale) ?? category.title}
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
                {t("header.logout")}
              </button>
            ) : (
              <Link className="glass-button glass-button--compact top-nav-link" href="/auth">
                {t("header.auth")}
              </Link>
            )}

            <LanguageSwitcher />
          </nav>

          {isHomePage ? (
            <div className="site-header-promo">
              <div className="site-header-promo-heading">
                <span>{t("header.dailyPromotions")}</span>
              </div>

              <div className="site-header-promotions-grid">
                {dailyPromotions.map((promotion) => (
                  // В шапке показываем только отобранные акции дня
                  <article className="site-header-offer" key={`header-promo-${promotion.id}`}>
                    <div className="site-header-offer-media">
                      <Image src={promotion.image} alt={promotion.title} fill unoptimized />
                    </div>

                    <div className="site-header-offer-copy">
                      <Link
                        className="site-header-offer-master"
                        href={`/masters/${promotion.masterId}`}
                      >
                        {t("header.master")} {promotion.masterName} ★ {promotion.masterRating.toFixed(1)}
                      </Link>
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
                    <span>{t("header.promotionsLoading")}</span>
                    <button
                      className="glass-button site-header-button"
                      type="button"
                      onClick={handleOpenChat}
                    >
                      {t("header.book")}
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
