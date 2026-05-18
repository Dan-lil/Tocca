"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logoutThunk } from "@/entities/user/api/UserApiThunk";
import { getCategories } from "@/shared/api/categoryApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import { CategoryType } from "@/shared/types";

const navigationItems = [
  { href: "/", label: "Домашняя страница" },
  { href: "#", label: "Профиль" },
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const handleOpenChat = () => {
    dispatchBookingModalOpen();
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/auth");
  };

  useEffect(() => {
    // Подгружаем категории для перехода к выбору услуги и записи
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
                    ? categories.map((category) => (
                        <Link
                          className="top-nav-dropdown-link"
                          href={`/services/${category.id}`}
                          key={category.id}
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
              <div className="site-header-offer"></div>

              <div className="site-header-actions">
                <Link className="glass-button site-header-button" href="#">
                  Записаться
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
