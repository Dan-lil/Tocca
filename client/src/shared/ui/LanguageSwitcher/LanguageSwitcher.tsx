"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

import { locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!pendingLocale) return;

    document.cookie = `NEXT_LOCALE=${pendingLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = pendingLocale;

    startTransition(() => {
      router.refresh();
    });
  }, [pendingLocale, router]);

  return (
    <div className="language-switcher" aria-label={t("language")}>
      {locales.map((item) => (
        <button
          className={`language-switcher-button${locale === item ? " is-active" : ""}`}
          key={item}
          type="button"
          onClick={() => setPendingLocale(item)}
        >
          {item === "ru" ? t("russian") : t("english")}
        </button>
      ))}
    </div>
  );
}
