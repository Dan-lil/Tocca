"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { logoutThunk } from "@/entities/user/api/UserApiThunk";
import { getServices } from "@/shared/api/serviziApi";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";
import { dispatchBookingModalOpen } from "@/shared/lib/bookingEvents";
import { ServiziType } from "@/shared/types";

const navigationItems = [
  { href: "/", label: "Домашняя страница" },
  { href: "/profile", label: "Профиль" },
  { href: "#", label: "AI Помощник", action: "open-chat" as const },
];

type HeaderServiceLink = {
  id: number;
  categoryId: number;
  title: string;
};

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.user);
  const isHomePage = pathname === "/";

  // Ref помогает закрывать dropdown кликом вне меню
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [services, setServices] = useState<ServiziType[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const handleOpenChat = () => {
    dispatchBookingModalOpen();
  };

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/auth");
  };

  useEffect(() => {
    // Подгружаем услуги из базы для dropdown в header
    const loadServices = async () => {
      try {
        setIsServicesLoading(true);
        setServicesError(null);
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (error) {
        setServicesError(
          error instanceof Error ? error.message : "Не удалось загрузить услуги",
        );
      } finally {
        setIsServicesLoading(false);
      }
    };

    void loadServices();
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

  const dropdownServices = useMemo<HeaderServiceLink[]>(
    // В dropdown показываем активные услуги с теми названиями, которые пришли из базы
    () =>
      services
        .filter((service) => service.isActive)
        .map((service) => ({
          id: service.id,
          categoryId: service.categoryId,
          title: service.title,
        })),
    [services],
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

            <div className="top-nav-dropdown" ref={dropdownRef}>
              {/* Кнопка открывает список услуг, которые приходят из Servizi */}
              <button
                className="glass-button glass-button--compact top-nav-link top-nav-button"
                type="button"
                aria-expanded={isDropdownOpen}
                aria-haspopup="menu"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                Услуги
              </button>

              {/* По услуге уходим на страницу категории и передаем serviceId для точного выбора */}
              {isDropdownOpen ? (
                <div className="top-nav-dropdown-menu glass-surface" role="menu">
                  {isServicesLoading ? (
                    <span className="top-nav-dropdown-state">Загрузка услуг</span>
                  ) : null}

                  {servicesError ? (
                    <span className="top-nav-dropdown-state">{servicesError}</span>
                  ) : null}

                  {!isServicesLoading && !servicesError
                    ? dropdownServices.map((service) => (
                        <Link
                          className="top-nav-dropdown-link"
                          href={`/services/${service.categoryId}?serviceId=${service.id}`}
                          key={service.id}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {service.title}
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
