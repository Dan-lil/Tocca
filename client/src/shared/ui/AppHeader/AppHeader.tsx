"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutThunk } from "@/entities/user/api/UserApiThunk";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useReduxHooks";

const navigationItems = [
  { href: "/", label: "Домашняя страница" },
  { href: "#", label: "Услуги" },
  { href: "/ClientProfile", label: "Профиль" },
  // AI не ведет по ссылке, а открывает глобальную модалку через событие
  { href: "#", label: "AI Помощник", action: "open-chat" as const },
];

export default function AppHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  // авторизация юзера определяет, что показывать в шапке: вход или выход
  const { user } = useAppSelector((state) => state.user);
  const isHomePage = pathname === "/";

  // единое поведение модалки
  const handleOpenChat = () => {
    window.dispatchEvent(new Event("open-booking-modal"));
  };

  // Выход из аккаунта и возврат на страницу авторизации
  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/auth");
  };

  return (
    <header className="site-header">
      <div className="site-header-shell">
        <div className="site-header-content">
          <nav className="top-nav glass-surface" aria-label="Основная навигация">
            {navigationItems.map((item) =>
              // Для AI кнопка, чтобы запускать глобальный сценарий открытия модалки
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
            {/* // Если пользователь в сессии, показываем выход кнопку; иначе ссылку на вход и рег */}
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
