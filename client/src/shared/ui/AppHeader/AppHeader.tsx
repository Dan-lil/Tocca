"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { href: "/", label: "Домашняя страница" },
  { href: "#", label: "Услуги" },
  { href: "#", label: "Профиль" },
  { href: "#", label: "AI Помощник" },
  { href: "/auth", label: "Регистрация/Вход" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <header className="site-header">
      <div className="site-header-shell">
        <div className="site-header-content">
          <nav className="top-nav glass-surface" aria-label="Основная навигация">
            {navigationItems.map((item) => (
              <Link
                className="glass-button glass-button--compact top-nav-link"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {isHomePage ? (
            <div className="site-header-promo">
              <div className="site-header-offer">
              </div>

              <div className="site-header-actions">
                <button className="glass-button site-header-button" type="button">
                  Записаться
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
